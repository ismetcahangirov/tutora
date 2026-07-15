import { z } from 'zod';

/**
 * Public (client-exposed) environment for the admin SPA. Only `VITE_*` variables
 * are exposed by Vite. Optional-with-defaults so builds never fail on a missing
 * var, but an invalid value still fails fast.
 */
const schema = z.object({
  VITE_API_URL: z.url().default('http://localhost:3000'),
  /** Google OAuth client ID for admin sign-in. Empty until configured. */
  VITE_GOOGLE_CLIENT_ID: z.string().default(''),
  /**
   * Sentry error + performance monitoring (issue #92). Optional: with an empty
   * DSN the SDK is never initialized, so dev/CI builds run without any Sentry
   * credentials. ENVIRONMENT tags events per deployment.
   */
  VITE_SENTRY_DSN: z.string().default(''),
  VITE_SENTRY_ENVIRONMENT: z.string().default('production'),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
});
