import * as Sentry from '@sentry/react';

import { env } from '@shared/config/env';

/**
 * Crash + performance reporting for the admin SPA (issue #92).
 *
 * Fail-soft: with no `VITE_SENTRY_DSN` the SDK is never started, so dev/CI builds
 * run without any Sentry credentials — mirroring the API's opt-in transports.
 */
export function initSentry(): void {
  const dsn = env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: env.VITE_SENTRY_ENVIRONMENT,
    integrations: [Sentry.browserTracingIntegration()],
    // Trace a slice of navigations; 100% would be noisy in production.
    tracesSampleRate: 0.1,
  });
}

/** Reports a router/render error to Sentry. No-op until the SDK is initialized. */
export function reportError(error: unknown): void {
  Sentry.captureException(error);
}
