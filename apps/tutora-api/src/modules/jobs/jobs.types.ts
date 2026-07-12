/**
 * The recurring maintenance jobs the worker runs (#38). The string values are
 * the BullMQ job names the processor switches on, so they must stay stable.
 */
export enum MaintenanceJob {
  /** Prune expired auth/refresh tokens, stale device tokens and old read notifications. */
  Cleanup = 'cleanup',
  /** Transition long-pending applications to EXPIRED. */
  ApplicationExpiry = 'application-expiry',
  /** Send each tutor a daily digest of new applications awaiting a response. */
  TutorDigest = 'tutor-digest',
}

/** A job paired with the cron pattern its scheduler fires on. */
export interface JobSchedule {
  /** The job to enqueue when the schedule fires. */
  readonly job: MaintenanceJob;
  /** Stable BullMQ job-scheduler id (idempotent upsert key). */
  readonly schedulerId: string;
  /** Standard 5-field cron pattern (evaluated in the server timezone). */
  readonly pattern: string;
}

/** Rows removed by a single {@link MaintenanceJob.Cleanup} run. */
export interface CleanupResult {
  refreshTokens: number;
  deviceTokens: number;
  notifications: number;
}

/** Outcome of an {@link MaintenanceJob.ApplicationExpiry} run. */
export interface ApplicationExpiryResult {
  expired: number;
}

/** Outcome of a {@link MaintenanceJob.TutorDigest} run. */
export interface TutorDigestResult {
  tutorsNotified: number;
  applications: number;
}

/** The result any maintenance job returns, stored by BullMQ for observability. */
export type JobResult = CleanupResult | ApplicationExpiryResult | TutorDigestResult;

/** A scheduled job projected for the admin API. */
export interface JobScheduleView {
  job: MaintenanceJob;
  pattern: string;
}

/** The identifier of a job enqueued on demand. */
export interface EnqueuedJobView {
  id: string | null;
  job: MaintenanceJob;
}
