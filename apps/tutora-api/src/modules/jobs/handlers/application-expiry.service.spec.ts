import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { subtractDays } from '@common/utils/time';
import { PENDING_APPLICATION_TTL_DAYS } from '../jobs.constants';
import { ApplicationExpiryService } from './application-expiry.service';

function buildPrismaMock(count = 0) {
  return {
    application: { updateMany: jest.fn().mockResolvedValue({ count }) },
  };
}

describe('ApplicationExpiryService', () => {
  const now = new Date('2026-07-12T00:05:00.000Z');

  it('expires applications still PENDING past the TTL', async () => {
    const prisma = buildPrismaMock(4);
    const service = new ApplicationExpiryService(prisma as unknown as PrismaService);

    await expect(service.run(now)).resolves.toEqual({ expired: 4 });
    expect(prisma.application.updateMany).toHaveBeenCalledWith({
      where: {
        status: ApplicationStatus.PENDING,
        createdAt: { lt: subtractDays(now, PENDING_APPLICATION_TTL_DAYS) },
      },
      data: { status: ApplicationStatus.EXPIRED },
    });
  });

  it('reports zero when nothing is stale', async () => {
    const prisma = buildPrismaMock(0);
    const service = new ApplicationExpiryService(prisma as unknown as PrismaService);

    await expect(service.run(now)).resolves.toEqual({ expired: 0 });
  });
});
