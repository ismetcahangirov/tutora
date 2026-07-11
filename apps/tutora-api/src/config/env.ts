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
