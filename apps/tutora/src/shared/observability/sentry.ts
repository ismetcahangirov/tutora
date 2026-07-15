import * as Sentry from '@sentry/react-native';

import { env } from '@/shared/config/env';

/**
 * Crash + performance reporting for the mobile app (issue #92).
 *
 * Initialization is fail-soft: with no `EXPO_PUBLIC_SENTRY_DSN` set (dev, CI, or
 * an unconfigured build) the SDK is never started, so the app runs without any
 * Sentry credentials — mirroring the API's opt-in Firebase/SMTP transports.
 */
export function initSentry(): void {
  const dsn = env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: env.EXPO_PUBLIC_SENTRY_ENVIRONMENT,
    // Sample a slice of transactions for tracing; 100% would be noisy in prod.
    tracesSampleRate: 0.1,
    // Attach IP/device context to events. No PII beyond what the SDK adds.
    sendDefaultPii: true,
  });
}

/**
 * Wraps the root component so Sentry can capture render errors and attach
 * navigation + touch breadcrumbs. Safe to apply unconditionally — a no-op when
 * the SDK was not initialized above.
 */
export const wrapWithSentry = Sentry.wrap;
