// Sentry initialization for the Edge runtime (issue #92).
// Loaded from instrumentation.ts when NEXT_RUNTIME === 'edge'.
import { initSentry } from '@shared/observability/sentry';

initSentry();
