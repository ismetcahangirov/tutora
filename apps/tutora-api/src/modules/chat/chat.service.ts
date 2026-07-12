import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { THREAD_INCLUDE, toMessageView, toThreadView } from './chat.mapper';
import { ChatRealtime } from './chat.realtime';
import type { MessageView, ThreadParticipants, ThreadView } from './chat.types';
import type { SendMessageDto } from './dto/send-message.dto';
import type { StartThreadDto } from './dto/start-thread.dto';

/**
 * Realtime 1:1 chat between a student and a tutor (#34). All persistence and
 * authorization live here; the ChatGateway only fans out the results. A thread
 * may be opened only between a student and a tutor who already have an
 * application between them.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: ChatRealtime,
  ) {}

  /**
   * Opens (or returns the existing) thread with the counterparty. The caller
   * supplies the counterparty's profile id for their role; the other side is
   * derived from the caller. Requires an application between the pair.
   */
  async openThread(user: AuthenticatedUser, dto: StartThreadDto): Promise<ThreadView> {
    const { studentId, tutorId } = await this.resolvePair(user, dto);

    const application = await this.prisma.application.findFirst({
      where: { studentId, tutorId },
      select: { id: true },
    });
    if (!application) {
      throw new ForbiddenException('You can only message someone you have an application with');
    }

    const thread = await this.prisma.chatThread.upsert({
      where: { studentId_tutorId: { studentId, tutorId } },
      create: { studentId, tutorId },
      update: {},
      include: THREAD_INCLUDE,
    });
    const unreadCount = await this.countUnread(thread.id, user.id);
    return toThreadView(thread, user.id, unreadCount);
  }

  /** The caller's threads, most-recently-active first, each with an unread count. */
  async listThreads(
    user: AuthenticatedUser,
    query: PaginationQueryDto,
  ): Promise<Paginated<ThreadView>> {
    const where = await this.threadScope(user);
    if (!where) {
      return buildPage([], 0, query.page, query.limit);
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.chatThread.findMany({
        where,
        include: THREAD_INCLUDE,
        orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.chatThread.count({ where }),
    ]);

    const unreadByThread = await this.unreadCountsFor(
      rows.map((row) => row.id),
      user.id,
    );
    const data = rows.map((row) => toThreadView(row, user.id, unreadByThread.get(row.id) ?? 0));
    return buildPage(data, total, query.page, query.limit);
  }

  /** Paginated message history for a thread the caller participates in. */
  async listMessages(
    user: AuthenticatedUser,
    threadId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<MessageView>> {
    await this.assertParticipant(user.id, threadId);
    const where: Prisma.ChatMessageWhereInput = { threadId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.chatMessage.count({ where }),
    ]);
    return buildPage(
      rows.map((row) => toMessageView(row, user.id)),
      total,
      query.page,
      query.limit,
    );
  }

  /** Persists a message, bumps the thread's activity, and broadcasts it. */
  async sendMessage(
    user: AuthenticatedUser,
    threadId: string,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    const participants = await this.assertParticipant(user.id, threadId);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: { threadId, senderId: user.id, body: dto.body },
      });
      await tx.chatThread.update({
        where: { id: threadId },
        data: { lastMessageAt: created.createdAt },
      });
      return created;
    });

    const view = toMessageView(message, user.id);
    this.realtime.emitNewMessage(view, participants.counterpartUserId);
    return view;
  }

  /** Marks the counterparty's unread messages as read and emits a receipt. */
  async markRead(user: AuthenticatedUser, threadId: string): Promise<{ readCount: number }> {
    await this.assertParticipant(user.id, threadId);
    const readAt = new Date();
    const result = await this.prisma.chatMessage.updateMany({
      where: { threadId, senderId: { not: user.id }, readAt: null },
      data: { readAt },
    });
    if (result.count > 0) {
      this.realtime.emitRead({ threadId, readerUserId: user.id, readAt });
    }
    return { readCount: result.count };
  }

  /** Total unread messages across all the caller's threads (badge count). */
  async unreadCount(user: AuthenticatedUser): Promise<{ count: number }> {
    const scope = await this.threadScope(user);
    if (!scope) {
      return { count: 0 };
    }
    const count = await this.prisma.chatMessage.count({
      where: { senderId: { not: user.id }, readAt: null, thread: scope },
    });
    return { count };
  }

  /**
   * Loads a thread and asserts the caller is one of its two participants,
   * returning both participant user ids and the counterparty. A non-participant
   * is told the thread does not exist (never leak its presence).
   */
  async assertParticipant(userId: string, threadId: string): Promise<ThreadParticipants> {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        student: { select: { userId: true } },
        tutor: { select: { userId: true } },
      },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    const studentUserId = thread.student.userId;
    const tutorUserId = thread.tutor.userId;
    if (userId !== studentUserId && userId !== tutorUserId) {
      throw new NotFoundException('Thread not found');
    }
    return {
      threadId,
      studentUserId,
      tutorUserId,
      counterpartUserId: userId === studentUserId ? tutorUserId : studentUserId,
    };
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private async resolvePair(
    user: AuthenticatedUser,
    dto: StartThreadDto,
  ): Promise<{ studentId: string; tutorId: string }> {
    if (user.role === UserRole.STUDENT) {
      if (!dto.tutorId) {
        throw new BadRequestException('tutorId is required');
      }
      const studentId = await this.ensureStudentProfileId(user.id);
      return { studentId, tutorId: dto.tutorId };
    }
    if (user.role === UserRole.TUTOR) {
      if (!dto.studentId) {
        throw new BadRequestException('studentId is required');
      }
      const tutorId = await this.tutorProfileIdOrThrow(user.id);
      return { studentId: dto.studentId, tutorId };
    }
    throw new ForbiddenException('Only students and tutors can use chat');
  }

  /** Where-clause scoping threads to the caller, or null if they have no profile. */
  private async threadScope(user: AuthenticatedUser): Promise<Prisma.ChatThreadWhereInput | null> {
    if (user.role === UserRole.STUDENT) {
      return { studentId: await this.ensureStudentProfileId(user.id) };
    }
    if (user.role === UserRole.TUTOR) {
      const tutorId = await this.tutorProfileId(user.id);
      return tutorId ? { tutorId } : null;
    }
    return null;
  }

  private countUnread(threadId: string, userId: string): Promise<number> {
    return this.prisma.chatMessage.count({
      where: { threadId, senderId: { not: userId }, readAt: null },
    });
  }

  private async unreadCountsFor(threadIds: string[], userId: string): Promise<Map<string, number>> {
    if (threadIds.length === 0) {
      return new Map();
    }
    const groups = await this.prisma.chatMessage.groupBy({
      by: ['threadId'],
      where: { threadId: { in: threadIds }, senderId: { not: userId }, readAt: null },
      _count: { _all: true },
    });
    return new Map(groups.map((group): [string, number] => [group.threadId, group._count._all]));
  }

  /**
   * Resolves the caller's student profile id, creating an empty profile on first
   * use. Handles the concurrent-first-write race via the unique index on userId.
   */
  private async ensureStudentProfileId(userId: string): Promise<string> {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    try {
      const created = await this.prisma.studentProfile.create({
        data: { userId },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.studentProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (raced) return raced.id;
      }
      throw error;
    }
  }

  private async tutorProfileId(userId: string): Promise<string | null> {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  private async tutorProfileIdOrThrow(userId: string): Promise<string> {
    const id = await this.tutorProfileId(userId);
    if (!id) {
      throw new NotFoundException('Tutor profile not found');
    }
    return id;
  }
}
