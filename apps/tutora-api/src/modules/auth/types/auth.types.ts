import type { UserRole } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Claims embedded in the access-token JWT by `TokenService.issueTokens`.
 * `role` is nullable until the user finishes onboarding (#23).
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole | null;
  onboardingCompleted: boolean;
}

/**
 * The authenticated principal attached to `request.user` by `JwtAuthGuard`
 * after a successful token verification. Consumed via `@CurrentUser()`.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole | null;
  onboardingCompleted: boolean;
}

export interface AuthUserSummary {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
  onboardingCompleted: boolean;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUserSummary;
}
