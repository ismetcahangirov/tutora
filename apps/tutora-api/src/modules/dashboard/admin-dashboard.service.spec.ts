import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminDashboardService, TREND_DAYS } from './admin-dashboard.service';

function buildPrismaMock() {
  return {
    user: { count: jest.fn(), findMany: jest.fn() },
    tutorProfile: { count: jest.fn(), groupBy: jest.fn() },
    subscription: { count: jest.fn() },
    review: { count: jest.fn() },
    payment: { aggregate: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

type PrismaMock = ReturnType<typeof buildPrismaMock>;

async function buildService(prisma: PrismaMock) {
  const moduleRef = await Test.createTestingModule({
    providers: [AdminDashboardService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(AdminDashboardService);
}

/** Seed the five `$transaction` counts in call order, plus the parallel reads. */
function seed(
  prisma: PrismaMock,
  options: {
    students?: number;
    tutors?: number;
    pending?: number;
    activeSubs?: number;
    reviews?: number;
    revenue?: number | null;
    byStatus?: { verificationStatus: string; _count: { _all: number } }[];
    recent?: { role: string | null; createdAt: Date }[];
  } = {},
) {
  prisma.user.count
    .mockResolvedValueOnce(options.students ?? 0)
    .mockResolvedValueOnce(options.tutors ?? 0);
  prisma.tutorProfile.count.mockResolvedValueOnce(options.pending ?? 0);
  prisma.subscription.count.mockResolvedValueOnce(options.activeSubs ?? 0);
  prisma.review.count.mockResolvedValueOnce(options.reviews ?? 0);
  prisma.payment.aggregate.mockResolvedValueOnce({
    _sum: { amount: options.revenue === undefined ? 0 : options.revenue },
  });
  prisma.tutorProfile.groupBy.mockResolvedValueOnce(options.byStatus ?? []);
  prisma.user.findMany.mockResolvedValueOnce(options.recent ?? []);
}

const NOW = new Date('2026-07-14T12:00:00Z');

describe('AdminDashboardService.getStats', () => {
  it('aggregates the headline KPIs', async () => {
    const prisma = buildPrismaMock();
    seed(prisma, {
      students: 10,
      tutors: 5,
      pending: 3,
      activeSubs: 4,
      reviews: 20,
      revenue: 199.98,
    });

    const service = await buildService(prisma);
    const stats = await service.getStats(NOW);

    expect(stats.kpis).toMatchObject({
      students: 10,
      tutors: 5,
      pendingVerifications: 3,
      activeSubscriptions: 4,
      publishedReviews: 20,
      monthlyRevenue: 199.98,
      revenueCurrency: 'AZN',
    });
  });

  it('reports zero revenue when no payments settled this month', async () => {
    const prisma = buildPrismaMock();
    seed(prisma, { revenue: null });

    const service = await buildService(prisma);
    const stats = await service.getStats(NOW);

    expect(stats.kpis.monthlyRevenue).toBe(0);
  });

  it('fills every verification status, even those with no tutors', async () => {
    const prisma = buildPrismaMock();
    seed(prisma, {
      byStatus: [
        { verificationStatus: 'VERIFIED', _count: { _all: 2 } },
        { verificationStatus: 'PENDING', _count: { _all: 3 } },
      ],
    });

    const service = await buildService(prisma);
    const stats = await service.getStats(NOW);

    const byStatus = Object.fromEntries(stats.tutorsByStatus.map((s) => [s.status, s.count]));
    expect(byStatus).toEqual({ UNVERIFIED: 0, PENDING: 3, VERIFIED: 2, REJECTED: 0 });
  });

  it('builds a zero-filled daily signups trend ending today (UTC)', async () => {
    const prisma = buildPrismaMock();
    seed(prisma, {
      recent: [
        { role: 'STUDENT', createdAt: new Date('2026-07-14T09:00:00Z') },
        { role: 'TUTOR', createdAt: new Date('2026-07-14T23:00:00Z') },
        // Outside the window — must be ignored by the bucketer.
        { role: 'STUDENT', createdAt: new Date('2026-01-01T00:00:00Z') },
      ],
    });

    const service = await buildService(prisma);
    const stats = await service.getStats(NOW);

    expect(stats.signups).toHaveLength(TREND_DAYS);
    expect(stats.signups.at(0)?.date).toBe('2026-06-15');
    expect(stats.signups.at(-1)).toEqual({
      date: '2026-07-14',
      students: 1,
      tutors: 1,
    });
    const totalStudents = stats.signups.reduce((sum, point) => sum + point.students, 0);
    expect(totalStudents).toBe(1);
  });
});
