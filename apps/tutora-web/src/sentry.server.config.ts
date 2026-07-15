// Sentry initialization for the Node.js server runtime (issue #92).
// Loaded from instrumentation.ts when NEXT_RUNTIME === 'nodejs'.
import { initSentry } from '@shared/observability/sentry';

initSentry();
