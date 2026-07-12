import { PrismaService } from '@/prisma/prisma.service';
import { subtractDays } from '@common/utils/time';
import {
  READ_NOTIFICATION_RETENTION_DAYS,
  REVOKED_REFRESH_TOKEN_GRACE_DAYS,
  STALE_DEVICE_TOKEN_DAYS,
} from '../jobs.constants';
import { CleanupService } from './cleanup.service';

function buildPrismaMock() {
  return {
    refreshToken: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
    deviceToken: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
    notification: { deleteMany: jest.fn().mockResolvedValue({ count: 5 }) },
  };
}

describe('CleanupService', () => {
  const now = new Date('2026-07-12T03:15:00.000Z');
  let prisma: ReturnType<typeof buildPrismaMock>;
  let service: CleanupService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new CleanupService(prisma as unknown as PrismaService);
  });

  it('returns the rows removed per table', async () => {
    await expect(service.run(now)).resolves.toEqual({
      refreshTokens: 3,
      deviceTokens: 2,
      notifications: 5,
    });
  });

  it('prunes refresh tokens past expiry or revoked beyond the grace window', async () => {
    await service.run(now);
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { revokedAt: { lt: subtractDays(now, REVOKED_REFRESH_TOKEN_GRACE_DAYS) } },
        ],
      },
    });
  });

  it('prunes device tokens unused past the staleness window', async () => {
    await service.run(now);
    expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({
      where: { lastUsedAt: { lt: subtractDays(now, STALE_DEVICE_TOKEN_DAYS) } },
    });
  });

  it('prunes only read notifications older than the retention window', async () => {
    await service.run(now);
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { readAt: { not: null, lt: subtractDays(now, READ_NOTIFICATION_RETENTION_DAYS) } },
    });
  });
});
