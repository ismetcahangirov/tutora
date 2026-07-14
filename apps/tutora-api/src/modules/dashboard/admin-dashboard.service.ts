import { Injectable } from '@nestjs/common';
import {
  PaymentStatus,
  ReviewStatus,
  SubscriptionStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { DashboardStats, SignupsPoint } from './dashboard.types';

/** How many trailing days the signups trend covers. */
export const TREND_DAYS = 30;

/** Currency the revenue KPI is reported in (the platform default). */
const REVENUE_CURRENCY = 'AZN';

/** UTC midnight of the given instant. */
function startOfUtcDay(instant: Date): Date {
  return new Date(Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()));
}

/** UTC midnight on the first of the given instant's month. */
function startOfUtcMonth(instant: Date): Date {
  return new Date(Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), 1));
}

/** `date` shifted by `days` (UTC). */
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** The `YYYY-MM-DD` UTC day key for an instant. */
function dayKey(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

/**
 * Read-only analytics for the admin dashboard (#61). Aggregates over existing
 * tables — no dedicated analytics store — so figures are always live. The
 * signups trend buckets a bounded window in memory (selecting only role +
 * createdAt) rather than issuing per-day queries or raw SQL.
 */
@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(now: Date = new Date()): Promise<DashboardStats> {
    const monthStart = startOfUtcMonth(now);
    const today = startOfUtcDay(now);
    const windowStart = addDays(today, -(TREND_DAYS - 1));

    const [students, tutors, pendingVerifications, activeSubscriptions, publishedReviews] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { role: UserRole.STUDENT, deletedAt: null } }),
        this.prisma.user.count({ where: { role: UserRole.TUTOR, deletedAt: null } }),
        this.prisma.tutorProfile.count({
          where: { verificationStatus: VerificationStatus.PENDING, deletedAt: null },
        }),
        this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
        this.prisma.review.count({ where: { status: ReviewStatus.PUBLISHED, deletedAt: null } }),
      ]);

    const [revenue, byStatus, recentUsers] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.SUCCEEDED, createdAt: { gte: monthStart } },
      }),
      this.prisma.tutorProfile.groupBy({
        by: ['verificationStatus'],
        _count: { _all: true },
        where: { deletedAt: null },
      }),
      this.prisma.user.findMany({
        where: { role: { not: null }, createdAt: { gte: windowStart } },
        select: { role: true, createdAt: true },
      }),
    ]);

    const countByStatus = new Map(byStatus.map((row) => [row.verificationStatus, row._count._all]));

    return {
      kpis: {
        students,
        tutors,
        pendingVerifications,
        activeSubscriptions,
        publishedReviews,
        monthlyRevenue: revenue._sum.amount ? Number(revenue._sum.amount) : 0,
        revenueCurrency: REVENUE_CURRENCY,
      },
      tutorsByStatus: Object.values(VerificationStatus).map((status) => ({
        status,
        count: countByStatus.get(status) ?? 0,
      })),
      signups: this.buildSignupsTrend(recentUsers, today),
    };
  }

  /** Bucket recent signups into a zero-filled daily series ending today (UTC). */
  private buildSignupsTrend(
    users: { role: UserRole | null; createdAt: Date }[],
    today: Date,
  ): SignupsPoint[] {
    const series: SignupsPoint[] = [];
    const index = new Map<string, SignupsPoint>();
    for (let offset = TREND_DAYS - 1; offset >= 0; offset -= 1) {
      const point: SignupsPoint = { date: dayKey(addDays(today, -offset)), students: 0, tutors: 0 };
      series.push(point);
      index.set(point.date, point);
    }

    for (const user of users) {
      const point = index.get(dayKey(user.createdAt));
      if (!point) continue;
      if (user.role === UserRole.STUDENT) point.students += 1;
      else if (user.role === UserRole.TUTOR) point.tutors += 1;
    }

    return series;
  }
}
