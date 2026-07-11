import type { UserRole } from '@prisma/client';

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
