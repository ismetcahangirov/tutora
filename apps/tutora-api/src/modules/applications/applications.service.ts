import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import { canTransition } from './application-status';
import { APPLICATION_INCLUDE, toApplicationView } from './applications.mapper';
import type { ApplicationView } from './applications.types';
import type { CreateApplicationDto } from './dto/create-application.dto';
import type { ListApplicationsQueryDto } from './dto/list-applications-query.dto';

/** Statuses that count as an "active" application to a given tutor. */
const ACTIVE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.PENDING,
  ApplicationStatus.ACCEPTED,
];

/**
 * Student→tutor applications with a status lifecycle (#32). Students create,
 * list and cancel their own applications; tutors act on the ones addressed to
 * them (accept / decline / complete). Every mutation is guarded by the
 * {@link canTransition} state machine so an application can never jump an
 * illegal edge.
 */
@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Student actions ──────────────────────────────────────────────────────

  /**
   * Opens an application to a published tutor. Guards against duplicates: a
   * student may not have two active (PENDING/ACCEPTED) applications with the
   * same tutor at once.
   */
  async create(userId: string, dto: CreateApplicationDto): Promise<ApplicationView> {
    const studentId = await this.ensureStudentProfileId(userId);

    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id: dto.tutorId, isPublished: true, deletedAt: null },
      select: { id: true },
    });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    if (dto.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: dto.subjectId },
        select: { id: true },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    const active = await this.prisma.application.findFirst({
      where: { studentId, tutorId: dto.tutorId, status: { in: ACTIVE_STATUSES } },
      select: { id: true },
    });
    if (active) {
      throw new ConflictException('You already have an active application with this tutor');
    }

    const created = await this.prisma.application.create({
      data: {
        studentId,
        tutorId: dto.tutorId,
        subjectId: dto.subjectId ?? null,
        format: dto.format ?? null,
        message: dto.message ?? null,
      },
      include: APPLICATION_INCLUDE,
    });
    return toApplicationView(created);
  }

  /** The caller's own applications, newest first, optionally filtered by status. */
  async listForStudent(
    userId: string,
    query: ListApplicationsQueryDto,
  ): Promise<Paginated<ApplicationView>> {
    const studentId = await this.ensureStudentProfileId(userId);
    const where: Prisma.ApplicationWhereInput = { studentId };
    if (query.status) {
      where.status = query.status;
    }
    return this.paginate(where, query);
  }

  /** A single application the caller owns. */
  async getForStudent(userId: string, id: string): Promise<ApplicationView> {
    const studentId = await this.ensureStudentProfileId(userId);
    const application = await this.prisma.application.findFirst({
      where: { id, studentId },
      include: APPLICATION_INCLUDE,
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return toApplicationView(application);
  }

  /** The student withdraws their application (PENDING or ACCEPTED → CANCELLED). */
  async cancel(userId: string, id: string): Promise<ApplicationView> {
    const studentId = await this.ensureStudentProfileId(userId);
    const current = await this.prisma.application.findFirst({
      where: { id, studentId },
      select: { id: true, status: true },
    });
    if (!current) {
      throw new NotFoundException('Application not found');
    }
    this.assertTransition(current.status, ApplicationStatus.CANCELLED);
    return this.applyStatus(id, ApplicationStatus.CANCELLED);
  }

  // ── Tutor actions ────────────────────────────────────────────────────────

  /** Applications addressed to the calling tutor, newest first. */
  async listForTutor(
    userId: string,
    query: ListApplicationsQueryDto,
  ): Promise<Paginated<ApplicationView>> {
    const tutorId = await this.tutorProfileId(userId);
    if (!tutorId) {
      return buildPage([], 0, query.page, query.limit);
    }
    const where: Prisma.ApplicationWhereInput = { tutorId };
    if (query.status) {
      where.status = query.status;
    }
    return this.paginate(where, query);
  }

  /** Tutor accepts a pending application. */
  accept(userId: string, id: string): Promise<ApplicationView> {
    return this.tutorTransition(userId, id, ApplicationStatus.ACCEPTED);
  }

  /** Tutor declines a pending application. */
  decline(userId: string, id: string): Promise<ApplicationView> {
    return this.tutorTransition(userId, id, ApplicationStatus.DECLINED);
  }

  /** Tutor marks an accepted application as completed (unlocks the review). */
  complete(userId: string, id: string): Promise<ApplicationView> {
    return this.tutorTransition(userId, id, ApplicationStatus.COMPLETED);
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async tutorTransition(
    userId: string,
    id: string,
    target: ApplicationStatus,
  ): Promise<ApplicationView> {
    const tutorId = await this.tutorProfileIdOrThrow(userId);
    const current = await this.prisma.application.findFirst({
      where: { id, tutorId },
      select: { id: true, status: true },
    });
    if (!current) {
      throw new NotFoundException('Application not found');
    }
    this.assertTransition(current.status, target);
    return this.applyStatus(id, target);
  }

  /**
   * Persists the new status. Accept/decline are a tutor's first response, so
   * they stamp `respondedAt`; cancel/complete leave it untouched.
   */
  private async applyStatus(id: string, target: ApplicationStatus): Promise<ApplicationView> {
    const data: Prisma.ApplicationUpdateInput = { status: target };
    if (target === ApplicationStatus.ACCEPTED || target === ApplicationStatus.DECLINED) {
      data.respondedAt = new Date();
    }
    const updated = await this.prisma.application.update({
      where: { id },
      data,
      include: APPLICATION_INCLUDE,
    });
    return toApplicationView(updated);
  }

  private assertTransition(from: ApplicationStatus, to: ApplicationStatus): void {
    if (!canTransition(from, to)) {
      throw new ConflictException(`Cannot change an application from ${from} to ${to}`);
    }
  }

  private async paginate(
    where: Prisma.ApplicationWhereInput,
    query: ListApplicationsQueryDto,
  ): Promise<Paginated<ApplicationView>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: APPLICATION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.application.count({ where }),
    ]);
    return buildPage(rows.map(toApplicationView), total, query.page, query.limit);
  }

  /**
   * Resolves the caller's student profile id, creating an empty profile on
   * first use. Onboarding sets the role but the profile row is created lazily,
   * so a student may apply before ever opening their profile. Handles the
   * concurrent-first-write race via the unique index on `userId`.
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
