/**
 * Users feature contracts (issue #62). Zod validates every backend payload at
 * the boundary; the TypeScript types are inferred from the schemas. Mirrors the
 * API's `AdminUserView` and admin user-management DTOs.
 */
import { z } from 'zod';

import { USER_ROLES, type UserRole } from '@shared/rbac';

/** Auth providers the backend issues (mirrors Prisma `AuthProvider`). */
export const AUTH_PROVIDERS = ['GOOGLE'] as const;

/** Admin-facing user projection. Dates arrive as ISO strings over JSON. */
export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  locale: z.string().nullable(),
  provider: z.enum(AUTH_PROVIDERS),
  role: z.enum(USER_ROLES).nullable(),
  onboardingCompleted: z.boolean(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

/** Lifecycle state the UI shows; the API models it through `deletedAt`. */
export type UserStatus = 'active' | 'suspended';

export function userStatus(user: AdminUser): UserStatus {
  return user.deletedAt ? 'suspended' : 'active';
}

/** Query parameters for the users list. */
export type ListUsersParams = {
  page: number;
  limit: number;
  role?: UserRole;
  q?: string;
  includeDeleted?: boolean;
};

/** Partial user update — only changed fields are sent. */
export type UpdateUserBody = {
  name?: string;
  role?: UserRole;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
};

/** Body to provision a shell user account, linked on first Google sign-in. */
export type CreateUserBody = {
  email: string;
  name?: string;
  role?: UserRole;
};
