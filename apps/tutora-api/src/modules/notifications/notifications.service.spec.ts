import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DevicePlatform, NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { NotificationAudience } from './notifications.types';

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'u1',
    email: 'u@t.co',
    role: UserRole.STUDENT,
    onboardingCompleted: true,
    ...overrides,
  };
}

function deviceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dev1',
    userId: 'u1',
    token: 'tok-1',
    platform: 'ANDROID',
    lastUsedAt: new Date('2026-06-01T00:00:00Z'),
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-06-01T00:00:00Z'),
    ...overrides,
  };
}

function notificationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'n1',
    userId: 'u1',
    type: NotificationType.SYSTEM,
    title: 'Title',
    body: 'Body',
    data: null,
    readAt: null,
    createdAt: new Date('2026-06-02T00:00:00Z'),
    ...overrides,
  };
}

function buildPrismaMock() {
  const prisma = {
    deviceToken: {
      upsert: jest.fn().mockResolvedValue(deviceRow()),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    notification: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(notificationRow()),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      update: jest.fn().mockResolvedValue(notificationRow({ readAt: new Date() })),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    user: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );
  return prisma;
}

// Standalone jest.fn()s (avoids @typescript-eslint/unbound-method on the class mock).
function buildPushMock(isConfigured = true) {
  const sendToTokens = jest
    .fn()
    .mockResolvedValue({ successCount: 0, failureCount: 0, invalidTokens: [] });
  const push = { isConfigured, sendToTokens } as unknown as PushService;
  return { push, sendToTokens };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>, push: PushService) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      NotificationsService,
      { provide: PrismaService, useValue: prisma },
      { provide: PushService, useValue: push },
    ],
  }).compile();
  return moduleRef.get(NotificationsService);
}

function query(overrides: Partial<ListNotificationsQueryDto> = {}): ListNotificationsQueryDto {
  return Object.assign(new ListNotificationsQueryDto(), overrides);
}

describe('NotificationsService.registerDevice', () => {
  it('upserts the token to the caller and hides the raw token in the view', async () => {
    const prisma = buildPrismaMock();
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.registerDevice(user(), {
      token: 'tok-1',
      platform: DevicePlatform.ANDROID,
    });

    expect(prisma.deviceToken.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { token: 'tok-1' },
        create: { userId: 'u1', token: 'tok-1', platform: 'ANDROID' },
      }),
    );
    expect(result).toMatchObject({ id: 'dev1', platform: 'ANDROID' });
    expect(result).not.toHaveProperty('token');
  });
});

describe('NotificationsService.unregisterDevice', () => {
  it('deletes only the caller’s own token', async () => {
    const prisma = buildPrismaMock();
    prisma.deviceToken.deleteMany.mockResolvedValueOnce({ count: 1 });
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.unregisterDevice(user(), 'tok-1');

    expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({
      where: { token: 'tok-1', userId: 'u1' },
    });
    expect(result).toEqual({ removed: 1 });
  });
});

describe('NotificationsService.list', () => {
  it('lists the caller’s notifications newest-first', async () => {
    const prisma = buildPrismaMock();
    prisma.notification.findMany.mockResolvedValueOnce([notificationRow()]);
    prisma.notification.count.mockResolvedValueOnce(1);
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.list(user(), query());

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } }),
    );
    expect(result.data[0]).toMatchObject({ id: 'n1', isRead: false });
    expect(result.meta.total).toBe(1);
  });

  it('filters to unread when unreadOnly is set', async () => {
    const prisma = buildPrismaMock();
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    await service.list(user(), query({ unreadOnly: true }));

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', readAt: null } }),
    );
  });
});

describe('NotificationsService.unreadCount', () => {
  it('counts the caller’s unread notifications', async () => {
    const prisma = buildPrismaMock();
    prisma.notification.count.mockResolvedValueOnce(4);
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.unreadCount(user());

    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'u1', readAt: null },
    });
    expect(result).toEqual({ count: 4 });
  });
});

describe('NotificationsService.markRead', () => {
  it('marks an unread notification read', async () => {
    const prisma = buildPrismaMock();
    prisma.notification.findFirst.mockResolvedValueOnce(notificationRow());
    const readRow = notificationRow({ readAt: new Date('2026-06-03T00:00:00Z') });
    prisma.notification.update.mockResolvedValueOnce(readRow);
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.markRead(user(), 'n1');

    expect(prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'n1' } }),
    );
    expect(result.isRead).toBe(true);
  });

  it('is a no-op update when already read', async () => {
    const prisma = buildPrismaMock();
    prisma.notification.findFirst.mockResolvedValueOnce(notificationRow({ readAt: new Date() }));
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    await service.markRead(user(), 'n1');

    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('rejects a notification that is not the caller’s', async () => {
    const prisma = buildPrismaMock();
    prisma.notification.findFirst.mockResolvedValueOnce(null);
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    await expect(service.markRead(user(), 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('NotificationsService.markAllRead', () => {
  it('marks every unread notification read', async () => {
    const prisma = buildPrismaMock();
    prisma.notification.updateMany.mockResolvedValueOnce({ count: 3 });
    const { push } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.markAllRead(user());

    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', readAt: null } }),
    );
    expect(result).toEqual({ readCount: 3 });
  });
});

describe('NotificationsService.notifyUser', () => {
  it('persists a SYSTEM notification and pushes to the user’s devices', async () => {
    const prisma = buildPrismaMock();
    prisma.notification.create.mockResolvedValueOnce(notificationRow({ id: 'n9' }));
    prisma.deviceToken.findMany.mockResolvedValueOnce([{ token: 'tok-a' }, { token: 'tok-b' }]);
    const { push, sendToTokens } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.notifyUser('u1', { title: 'Hi', body: 'There' });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: 'u1', type: NotificationType.SYSTEM, title: 'Hi', body: 'There' },
    });
    expect(sendToTokens).toHaveBeenCalledWith(
      ['tok-a', 'tok-b'],
      expect.objectContaining({ data: { type: NotificationType.SYSTEM, notificationId: 'n9' } }),
    );
    expect(result).toMatchObject({ id: 'n9' });
  });

  it('skips push entirely when Firebase is not configured', async () => {
    const prisma = buildPrismaMock();
    const { push, sendToTokens } = buildPushMock(false);
    const service = await buildService(prisma, push);

    await service.notifyUser('u1', { title: 'Hi', body: 'There' });

    expect(prisma.deviceToken.findMany).not.toHaveBeenCalled();
    expect(sendToTokens).not.toHaveBeenCalled();
  });
});

describe('NotificationsService.broadcast', () => {
  it('fans out to a segment and pushes, returning the recipient count', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findMany.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
    prisma.deviceToken.findMany.mockResolvedValueOnce([{ token: 'tok-a' }]);
    const { push, sendToTokens } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.broadcast({
      audience: NotificationAudience.STUDENTS,
      title: 'Sale',
      body: '50% off',
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null, role: UserRole.STUDENT } }),
    );
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ userId: 'a', type: NotificationType.ANNOUNCEMENT }),
        expect.objectContaining({ userId: 'b', type: NotificationType.ANNOUNCEMENT }),
      ],
    });
    expect(sendToTokens).toHaveBeenCalled();
    expect(result).toEqual({ recipients: 2 });
  });

  it('does nothing when the segment is empty', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findMany.mockResolvedValueOnce([]);
    const { push, sendToTokens } = buildPushMock();
    const service = await buildService(prisma, push);

    const result = await service.broadcast({
      audience: NotificationAudience.ALL,
      title: 'Hi',
      body: 'All',
    });

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
    expect(sendToTokens).not.toHaveBeenCalled();
    expect(result).toEqual({ recipients: 0 });
  });

  it('prunes tokens FCM reports as dead', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findMany.mockResolvedValueOnce([{ id: 'a' }]);
    prisma.deviceToken.findMany.mockResolvedValueOnce([{ token: 'dead' }, { token: 'live' }]);
    const { push, sendToTokens } = buildPushMock();
    sendToTokens.mockResolvedValueOnce({
      successCount: 1,
      failureCount: 1,
      invalidTokens: ['dead'],
    });
    const service = await buildService(prisma, push);

    await service.broadcast({ audience: NotificationAudience.TUTORS, title: 'T', body: 'B' });

    expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({
      where: { token: { in: ['dead'] } },
    });
  });
});
