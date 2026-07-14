import { describe, expect, it } from 'vitest';

import { dashboardStatsSchema, VERIFICATION_STATUSES } from './types';

const rawStats = {
  kpis: {
    students: 120,
    tutors: 45,
    pendingVerifications: 6,
    activeSubscriptions: 30,
    publishedReviews: 210,
    monthlyRevenue: 1499.5,
    revenueCurrency: 'AZN',
  },
  tutorsByStatus: [
    { status: 'UNVERIFIED', count: 4 },
    { status: 'PENDING', count: 6 },
    { status: 'VERIFIED', count: 33 },
    { status: 'REJECTED', count: 2 },
  ],
  signups: [
    { date: '2026-06-15', students: 3, tutors: 1 },
    { date: '2026-06-16', students: 0, tutors: 2 },
  ],
};

describe('dashboardStatsSchema', () => {
  it('parses a valid stats payload', () => {
    const stats = dashboardStatsSchema.parse(rawStats);
    expect(stats.kpis.monthlyRevenue).toBe(1499.5);
    expect(stats.tutorsByStatus).toHaveLength(4);
    expect(stats.signups[0]?.date).toBe('2026-06-15');
  });

  it('rejects an unknown verification status', () => {
    const bad = {
      ...rawStats,
      tutorsByStatus: [{ status: 'ARCHIVED', count: 1 }],
    };
    expect(dashboardStatsSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a non-numeric KPI', () => {
    const bad = { ...rawStats, kpis: { ...rawStats.kpis, students: '120' } };
    expect(dashboardStatsSchema.safeParse(bad).success).toBe(false);
  });
});

describe('VERIFICATION_STATUSES', () => {
  it('lists the four verification states', () => {
    expect(VERIFICATION_STATUSES).toEqual(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']);
  });
});
