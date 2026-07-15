import * as Sentry from '@sentry/nextjs';

import { initSentry } from '@shared/observability/sentry';

// Browser-side Sentry init (issue #92). Runs before the app hydrates.
initSentry();

// Instruments client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
