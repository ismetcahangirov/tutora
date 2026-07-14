/**
 * Auth feature contracts (issue #60). Zod is the single source of truth: the
 * runtime schemas validate every backend payload at the boundary, and the
 * TypeScript types are inferred from them. Mirrors the API's `AuthResponse`.
 */
import { z } from 'zod';

import { USER_ROLES } from '@shared/rbac';

export const userRoleSchema = z.enum(USER_ROLES);

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  // Nullable until the user finishes onboarding; admins always have ADMIN.
  role: userRoleSchema.nullable(),
  onboardingCompleted: z.boolean(),
});

export const sessionTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const authResponseSchema = sessionTokensSchema.extend({
  user: authUserSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokens = z.infer<typeof sessionTokensSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

/** Lifecycle of the auth session, surfaced to route guards and the UI. */
export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';
