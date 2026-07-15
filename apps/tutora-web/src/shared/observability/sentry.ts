import * as Sentry from '@sentry/nextjs';

import { env } from '@shared/config/env';

/**
 * Shared Sentry init for the landing site (issue #92), called from the server,
 * edge, and client entry points. The Next.js SDK applies the appropriate default
 * integrations per runtime, so one config covers all three.
 *
 * Fail-soft: with no `NEXT_PUBLIC_SENTRY_DSN` the SDK is never started, so dev/CI
 * builds run without any Sentry credentials.
 */
export function initSentry(): void {
  const dsn = env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    // Trace a slice of requests/navigations; 100% would be noisy in production.
    tracesSampleRate: 0.1,
  });
}
