import { Injectable, Logger } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { subtractDays } from '@common/utils/time';
import { PENDING_APPLICATION_TTL_DAYS } from '../jobs.constants';
import type { ApplicationExpiryResult } from '../jobs.types';

/**
 * Expires stale applications (#38 scheduled tasks).
 *
 * An application left PENDING past its TTL is effectively dead — the tutor never
 * responded. This transitions those rows to EXPIRED in one indexed bulk update
 * so lists, counts and metrics reflect reality instead of accumulating zombies.
 */
@Injectable()
export class ApplicationExpiryService {
  private readonly logger = new Logger(ApplicationExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Marks every application still PENDING past the TTL as EXPIRED. */
  async run(now: Date = new Date()): Promise<ApplicationExpiryResult> {
    const expireBefore = subtractDays(now, PENDING_APPLICATION_TTL_DAYS);
    const { count } = await this.prisma.application.updateMany({
      where: { status: ApplicationStatus.PENDING, createdAt: { lt: expireBefore } },
      data: { status: ApplicationStatus.EXPIRED },
    });

    if (count > 0) {
      this.logger.log(`Expired ${count} stale pending applications`);
    }
    return { expired: count };
  }
}
