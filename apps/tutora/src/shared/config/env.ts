import { z } from 'zod';

/**
 * Public (client-exposed) environment for the mobile app. Only `EXPO_PUBLIC_*`
 * variables are inlined by Expo. Optional-with-defaults so builds never fail on
 * a missing var, but an invalid value still fails fast.
 */
const schema = z.object({
  EXPO_PUBLIC_API_URL: z.url().default('http://localhost:3000'),
  /**
   * Google OAuth client IDs for native Google sign-in (issue #22). Optional with
   * empty-string defaults so CI/dev builds never fail on a missing var; the
   * sign-in gateway surfaces a clear error at runtime when a required id is
   * absent. Web client id is the one whose `idToken` audience the backend
   * verifies; iOS/Android ids are used by the platform-specific OAuth clients.
   */
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().default(''),
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: z.string().default(''),
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: z.string().default(''),
  /**
   * Sentry crash + performance reporting (issue #92). Optional: with an empty
   * DSN the SDK is never initialized, so dev/CI builds run without any Sentry
   * credentials. `ENVIRONMENT` tags events per release channel (development /
   * preview / production) and is set by the matching EAS build profile.
   */
  EXPO_PUBLIC_SENTRY_DSN: z.string().default(''),
  EXPO_PUBLIC_SENTRY_ENVIRONMENT: z.string().default('production'),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  EXPO_PUBLIC_SENTRY_ENVIRONMENT: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT,
});
