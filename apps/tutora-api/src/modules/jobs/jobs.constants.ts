import { MaintenanceJob, type JobSchedule } from './jobs.types';

/** The single queue every recurring maintenance job flows through. */
export const MAINTENANCE_QUEUE = 'maintenance';

/**
 * The cron schedule for every maintenance job. Registered as BullMQ job
 * schedulers on boot ({@link JobsService}) — idempotent and distributed, so a
 * job fires exactly once per interval no matter how many API instances run.
 * Times are off-peak; the hourly expiry keeps stale applications fresh.
 */
export const JOB_SCHEDULES: readonly JobSchedule[] = [
  { job: MaintenanceJob.Cleanup, schedulerId: 'maintenance:cleanup', pattern: '15 3 * * *' },
  {
    job: MaintenanceJob.ApplicationExpiry,
    schedulerId: 'maintenance:application-expiry',
    pattern: '5 * * * *',
  },
  {
    job: MaintenanceJob.TutorDigest,
    schedulerId: 'maintenance:tutor-digest',
    pattern: '0 8 * * *',
  },
];

// ── Retention / TTL thresholds ────────────────────────────────────────────────

/** Delete revoked refresh tokens this many days after revocation (audit grace). */
export const REVOKED_REFRESH_TOKEN_GRACE_DAYS = 7;

/** Delete device (push) tokens unused for this many days. */
export const STALE_DEVICE_TOKEN_DAYS = 60;

/** Delete read in-app notifications older than this many days. */
export const READ_NOTIFICATION_RETENTION_DAYS = 90;

/** Expire applications still PENDING after this many days. */
export const PENDING_APPLICATION_TTL_DAYS = 14;

/** How far back a tutor digest looks for new applications. */
export const DIGEST_LOOKBACK_HOURS = 24;
