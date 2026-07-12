import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { ChatRealtime } from './chat.realtime';
import { ChatService } from './chat.service';

function studentUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'stuUser',
    email: 's@t.co',
    role: UserRole.STUDENT,
    onboardingCompleted: true,
    ...overrides,
  };
}
function tutorUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'tutUser',
    email: 't@t.co',
    role: UserRole.TUTOR,
    onboardingCompleted: true,
    ...overrides,
  };
}

function threadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'thr1',
    lastMessageAt: new Date('2026-05-01T00:00:00Z'),
    createdAt: new Date('2026-04-01T00:00:00Z'),
    student: { userId: 'stuUser', user: { name: 'Sam', avatarUrl: null } },
    tutor: { userId: 'tutUser', user: { name: 'Tia', avatarUrl: null } },
    messages: [],
    ...overrides,
  };
}

const participants = { id: 'thr1', student: { userId: 'stuUser' }, tutor: { userId: 'tutUser' } };

function buildPrismaMock() {
  const prisma = {
    studentProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'sp1' }), create: jest.fn() },
    tutorProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'tp1' }) },
    application: { findFirst: jest.fn().mockResolvedValue({ id: 'app1' }) },
    chatThread: {
      upsert: jest.fn().mockResolvedValue(threadRow()),
      findUnique: jest.fn().mockResolvedValue(participants),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );
  return prisma;
}

// Lint adaptation: expose jest.fn()s as standalone variables so we can assert
// on them without referencing methods off a class-typed instance (which trips
// @typescript-eslint/unbound-method). The realtime object is cast via
// `as unknown as ChatRealtime` so the DI token still resolves correctly.
function buildRealtimeMock() {
  const emitNewMessage = jest.fn();
  const emitRead = jest.fn();
  const realtime = { emitNewMessage, emitRead, bind: jest.fn() } as unknown as ChatRealtime;
  return { realtime, emitNewMessage, emitRead };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>, realtime: ChatRealtime) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      ChatService,
      { provide: PrismaService, useValue: prisma },
      { provide: ChatRealtime, useValue: realtime },
    ],
  }).compile();
  return moduleRef.get(ChatService);
}

function page(overrides: Partial<PaginationQueryDto> = {}): PaginationQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

describe('ChatService.openThread', () => {
  it('opens a thread for a student who has an application with the tutor', async () => {
    const prisma = buildPrismaMock();
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.openThread(studentUser(), { tutorId: 'tp1' });

    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { studentId: 'sp1', tutorId: 'tp1' },
      select: { id: true },
    });
    expect(prisma.chatThread.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId_tutorId: { studentId: 'sp1', tutorId: 'tp1' } },
        create: { studentId: 'sp1', tutorId: 'tp1' },
      }),
    );
    expect(result.counterpart).toMatchObject({ userId: 'tutUser', role: UserRole.TUTOR });
  });

  it('rejects a student who did not supply a tutorId', async () => {
    const prisma = buildPrismaMock();
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);
    await expect(service.openThread(studentUser(), {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids opening a thread without an application', async () => {
    const prisma = buildPrismaMock();
    prisma.application.findFirst.mockResolvedValueOnce(null);
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);
    await expect(service.openThread(studentUser(), { tutorId: 'tp1' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.chatThread.upsert).not.toHaveBeenCalled();
  });

  it('opens a thread for a tutor using the student profile id', async () => {
    const prisma = buildPrismaMock();
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    await service.openThread(tutorUser(), { studentId: 'sp1' });

    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { studentId: 'sp1', tutorId: 'tp1' },
      select: { id: true },
    });
  });
});

describe('ChatService.listThreads', () => {
  it('lists a student’s threads with unread counts', async () => {
    const prisma = buildPrismaMock();
    prisma.chatThread.findMany.mockResolvedValueOnce([threadRow()]);
    prisma.chatThread.count.mockResolvedValueOnce(1);
    prisma.chatMessage.groupBy.mockResolvedValueOnce([{ threadId: 'thr1', _count: { _all: 2 } }]);
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.listThreads(studentUser(), page());

    expect(prisma.chatThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 'sp1' } }),
    );
    expect(result.data[0]).toMatchObject({ id: 'thr1', unreadCount: 2 });
    expect(result.meta.total).toBe(1);
  });

  it('returns an empty page for a tutor with no profile', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(null);
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.listThreads(tutorUser(), page());

    expect(result.data).toEqual([]);
    expect(prisma.chatThread.findMany).not.toHaveBeenCalled();
  });
});

describe('ChatService.listMessages', () => {
  it('returns messages newest-first for a participant', async () => {
    const prisma = buildPrismaMock();
    prisma.chatMessage.findMany.mockResolvedValueOnce([
      {
        id: 'm1',
        threadId: 'thr1',
        senderId: 'tutUser',
        body: 'yo',
        readAt: null,
        createdAt: new Date(),
      },
    ]);
    prisma.chatMessage.count.mockResolvedValueOnce(1);
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.listMessages(studentUser(), 'thr1', page());

    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { threadId: 'thr1' }, orderBy: { createdAt: 'desc' } }),
    );
    expect(result.data[0]).toMatchObject({ id: 'm1', isMine: false });
  });
});

describe('ChatService.sendMessage', () => {
  it('persists the message, bumps lastMessageAt and broadcasts it', async () => {
    const prisma = buildPrismaMock();
    const created = {
      id: 'msg1',
      threadId: 'thr1',
      senderId: 'stuUser',
      body: 'hi',
      readAt: null,
      createdAt: new Date('2026-05-02T00:00:00Z'),
    };
    prisma.chatMessage.create.mockResolvedValueOnce(created);
    const { realtime, emitNewMessage } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.sendMessage(studentUser(), 'thr1', { body: 'hi' });

    expect(prisma.chatMessage.create).toHaveBeenCalledWith({
      data: { threadId: 'thr1', senderId: 'stuUser', body: 'hi' },
    });
    expect(prisma.chatThread.update).toHaveBeenCalledWith({
      where: { id: 'thr1' },
      data: { lastMessageAt: created.createdAt },
    });
    expect(emitNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'msg1', isMine: true }),
      'tutUser',
    );
    expect(result).toMatchObject({ id: 'msg1', isMine: true });
  });

  it('rejects a non-participant with NotFound', async () => {
    const prisma = buildPrismaMock();
    prisma.chatThread.findUnique.mockResolvedValueOnce({
      id: 'thr1',
      student: { userId: 'other1' },
      tutor: { userId: 'other2' },
    });
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);
    await expect(service.sendMessage(studentUser(), 'thr1', { body: 'hi' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.chatMessage.create).not.toHaveBeenCalled();
  });

  it('rejects sending to a missing thread', async () => {
    const prisma = buildPrismaMock();
    prisma.chatThread.findUnique.mockResolvedValueOnce(null);
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);
    await expect(service.sendMessage(studentUser(), 'nope', { body: 'hi' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('ChatService.markRead', () => {
  it('marks the counterparty’s unread messages and emits a receipt', async () => {
    const prisma = buildPrismaMock();
    prisma.chatMessage.updateMany.mockResolvedValueOnce({ count: 3 });
    const { realtime, emitRead } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.markRead(studentUser(), 'thr1');

    expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { threadId: 'thr1', senderId: { not: 'stuUser' }, readAt: null },
      }),
    );
    expect(emitRead).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: 'thr1', readerUserId: 'stuUser' }),
    );
    expect(result).toEqual({ readCount: 3 });
  });

  it('does not emit a receipt when nothing was unread', async () => {
    const prisma = buildPrismaMock();
    prisma.chatMessage.updateMany.mockResolvedValueOnce({ count: 0 });
    const { realtime, emitRead } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    await service.markRead(studentUser(), 'thr1');

    expect(emitRead).not.toHaveBeenCalled();
  });
});

describe('ChatService.unreadCount', () => {
  it('counts unread messages across the student’s threads', async () => {
    const prisma = buildPrismaMock();
    prisma.chatMessage.count.mockResolvedValueOnce(5);
    const { realtime } = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.unreadCount(studentUser());

    expect(prisma.chatMessage.count).toHaveBeenCalledWith({
      where: { senderId: { not: 'stuUser' }, readAt: null, thread: { studentId: 'sp1' } },
    });
    expect(result).toEqual({ count: 5 });
  });
});
