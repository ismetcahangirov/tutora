import type { VerificationStatus } from '@prisma/client';

/** One day of the signups trend: new students and tutors created that day. */
export interface SignupsPoint {
  /** UTC day, `YYYY-MM-DD`. */
  date: string;
  students: number;
  tutors: number;
}

/** Tutor headcount for one verification state. */
export interface TutorStatusCount {
  status: VerificationStatus;
  count: number;
}

/** Headline KPIs for the admin dashboard (#61). */
export interface DashboardKpis {
  /** Active (non-deleted) student accounts. */
  students: number;
  /** Active (non-deleted) tutor accounts. */
  tutors: number;
  /** Tutors awaiting verification review — the moderation backlog. */
  pendingVerifications: number;
  /** Currently active paid subscriptions. */
  activeSubscriptions: number;
  /** Visible reviews (excludes hidden/removed). */
  publishedReviews: number;
  /** Revenue from succeeded payments in the current calendar month. */
  monthlyRevenue: number;
  /** Currency the revenue figure is reported in. */
  revenueCurrency: string;
}

/** Full payload of `GET /api/v1/admin/dashboard` (#61). */
export interface DashboardStats {
  kpis: DashboardKpis;
  /** Tutor headcount per verification state (drives the breakdown chart). */
  tutorsByStatus: TutorStatusCount[];
  /** Daily signups over the trailing window (drives the trend chart). */
  signups: SignupsPoint[];
}
