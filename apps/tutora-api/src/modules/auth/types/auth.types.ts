import type { UserRole } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
