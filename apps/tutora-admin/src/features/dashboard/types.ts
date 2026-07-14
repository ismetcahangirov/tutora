/**
 * Dashboard analytics contracts (issue #61). Mirrors the API's `DashboardStats`.
 * Zod validates the payload at the boundary; the TypeScript types are inferred
 * from the schema.
 */
import { z } from 'zod';

/** Tutor verification states (mirrors Prisma `VerificationStatus`). */
export const VERIFICATION_STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const dashboardStatsSchema = z.object({
  kpis: z.object({
    students: z.number(),
    tutors: z.number(),
    pendingVerifications: z.number(),
    activeSubscriptions: z.number(),
    publishedReviews: z.number(),
    monthlyRevenue: z.number(),
    revenueCurrency: z.string(),
  }),
  tutorsByStatus: z.array(z.object({ status: z.enum(VERIFICATION_STATUSES), count: z.number() })),
  signups: z.array(z.object({ date: z.string(), students: z.number(), tutors: z.number() })),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type DashboardKpis = DashboardStats['kpis'];
export type SignupsPoint = DashboardStats['signups'][number];
export type TutorStatusCount = DashboardStats['tutorsByStatus'][number];
