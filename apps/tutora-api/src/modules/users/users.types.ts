import type { AuthProvider, User, UserRole } from '@prisma/client';

/**
 * Normalized Google profile extracted from a verified idToken.
 * Produced by the auth GoogleVerifierService, consumed by UsersService.
 */
export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  locale?: string;
}

/**
 * Public, non-sensitive projection of a user returned by profile endpoints
 * such as `GET /users/me`. Excludes credentials and internal fields.
 */
export interface UserSummary {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
  onboardingCompleted: boolean;
}

/**
 * Fuller projection returned by admin user-management endpoints. Still omits
 * internal linkage such as `googleId`, but exposes lifecycle and audit fields an
 * administrator needs (verification, soft-delete state, timestamps).
 */
export interface AdminUserView {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  locale: string | null;
  provider: AuthProvider;
  role: UserRole | null;
  onboardingCompleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Maps a full `User` row to the admin-facing view, dropping internal fields. */
export function toAdminUserView(user: User): AdminUserView {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    avatarUrl: user.avatarUrl,
    locale: user.locale,
    provider: user.provider,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
    deletedAt: user.deletedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
