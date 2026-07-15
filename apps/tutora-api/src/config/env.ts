import { z } from 'zod';

/**
 * Environment schema for the API. Every server-side variable is declared here
 * once and validated at startup so misconfiguration fails fast and closed.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Data stores (provided by docker-compose in #7).
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),

  // Auth (see .claude/context/architecture.md — JWT + refresh rotation).
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Google OAuth — audience the mobile idToken is verified against.
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),

  // Mailer (localized transactional email — #84). All optional: when SMTP_HOST
  // is unset the mailer uses a no-network transport so the API runs without
  // credentials in dev/test/CI.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Tutora <no-reply@tutora.app>'),

  // Push notifications (Firebase Cloud Messaging — #35). All optional: when the
  // service-account credentials are unset the push transport becomes a no-op, so
  // the API runs (and features that trigger notifications still succeed) without
  // Firebase credentials in dev/test/CI. Never commit real values — inject them
  // via the secrets manager. FIREBASE_PRIVATE_KEY may contain escaped newlines.
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Media uploads (Cloud Storage — #37). The Firebase Storage / GCS bucket that
  // signed avatar & certificate uploads are issued against, reusing the FIREBASE_*
  // service account above for signing. Optional: when unset (or without the
  // service account) the upload endpoint reports 503 while the rest of the API
  // runs — so dev/test/CI need no storage credentials.
  FIREBASE_STORAGE_BUCKET: z.string().optional(),

  // Error + performance monitoring (Sentry — #92). Optional: with no SENTRY_DSN
  // the SDK is never initialized (see instrument.ts), so dev/test/CI run without
  // any Sentry credentials. SENTRY_ENVIRONMENT tags events per deployment.
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates raw environment variables. On failure, throws a single
 * error listing every problem so the misconfiguration is obvious at boot.
 * Wired into Nest via `ConfigModule.forRoot({ validate: validateEnv })`.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}
