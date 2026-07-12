import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { subtractDays } from '@common/utils/time';
import {
  READ_NOTIFICATION_RETENTION_DAYS,
  REVOKED_REFRESH_TOKEN_GRACE_DAYS,
  STALE_DEVICE_TOKEN_DAYS,
} from '../jobs.constants';
import type { CleanupResult } from '../jobs.types';

/**
 * Data-retention cleanup (#38 cleanups).
 *
 * Prunes rows that no longer serve a purpose: expired/long-revoked refresh
 * tokens (auth hygiene), device tokens no client has used in months (push
 * hygiene), and read notifications past the retention window. Each prune is an
 * indexed bulk delete; the run returns per-table counts for observability.
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Runs every prune concurrently and returns the rows removed per table. */
  async run(now: Date = new Date()): Promise<CleanupResult> {
    const [refreshTokens, deviceTokens, notifications] = await Promise.all([
      this.pruneRefreshTokens(now),
      this.pruneDeviceTokens(now),
      this.pruneReadNotifications(now),
    ]);

    const result: CleanupResult = { refreshTokens, deviceTokens, notifications };
    this.logger.log(
      `Cleanup removed ${refreshTokens} refresh tokens, ${deviceTokens} device tokens, ${notifications} notifications`,
    );
    return result;
  }

  /** Deletes refresh tokens past expiry, or revoked beyond the audit grace. */
  private async pruneRefreshTokens(now: Date): Promise<number> {
    const revokedBefore = subtractDays(now, REVOKED_REFRESH_TOKEN_GRACE_DAYS);
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: revokedBefore } }],
      },
    });
    return count;
  }

  /** Deletes device tokens no client has used within the staleness window. */
  private async pruneDeviceTokens(now: Date): Promise<number> {
    const staleBefore = subtractDays(now, STALE_DEVICE_TOKEN_DAYS);
    const { count } = await this.prisma.deviceToken.deleteMany({
      where: { lastUsedAt: { lt: staleBefore } },
    });
    return count;
  }

  /** Deletes read notifications older than the retention window. */
  private async pruneReadNotifications(now: Date): Promise<number> {
    const readBefore = subtractDays(now, READ_NOTIFICATION_RETENTION_DAYS);
    const { count } = await this.prisma.notification.deleteMany({
      where: { readAt: { not: null, lt: readBefore } },
    });
    return count;
  }
}
