import { z } from 'zod';

/**
 * Public (client-exposed) environment for the landing site. Only `NEXT_PUBLIC_*`
 * variables are readable in the browser. Optional-with-defaults so builds never
 * fail on a missing var, but an invalid value still fails fast.
 */
const schema = z.object({
  /** Canonical origin of the landing site — powers metadataBase, canonical URLs,
   *  hreflang alternates, the sitemap, and Open Graph absolute URLs. */
  NEXT_PUBLIC_SITE_URL: z.url().default('https://tutora.az'),
  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:3000'),
  /** Store listings for the mobile app. `#` until the apps are published. */
  NEXT_PUBLIC_IOS_URL: z.string().default('#'),
  NEXT_PUBLIC_ANDROID_URL: z.string().default('#'),
  /**
   * Sentry error + performance monitoring (issue #92). Optional: with an empty
   * DSN the SDK is never initialized, so dev/CI builds run without any Sentry
   * credentials. ENVIRONMENT tags events per deployment.
   */
  NEXT_PUBLIC_SENTRY_DSN: z.string().default(''),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().default('production'),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_IOS_URL: process.env.NEXT_PUBLIC_IOS_URL,
  NEXT_PUBLIC_ANDROID_URL: process.env.NEXT_PUBLIC_ANDROID_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
});
