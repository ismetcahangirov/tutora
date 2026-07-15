import * as Sentry from '@sentry/nestjs';

/**
 * Sentry bootstrap (issue #92). Imported first in main.ts so the SDK is
 * initialized before any other module — Sentry's auto-instrumentation must patch
 * dependencies at require time.
 *
 * Fail-soft: with no `SENTRY_DSN` the SDK is never started, so dev/test/CI run
 * without any Sentry credentials — mirroring the opt-in Firebase/SMTP transports.
 * We read `process.env` directly (not the validated config) because this runs
 * before the Nest application — and its ConfigModule — is created.
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    // Trace a slice of requests; 100% would be costly on a busy API.
    tracesSampleRate: 0.1,
    // Ship structured logs to Sentry alongside errors.
    enableLogs: true,
  });
}
