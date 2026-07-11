import { Injectable } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { GoogleVerifierService } from './services/google-verifier.service';
import { TokenService } from './services/token.service';
import type { AuthResponse, AuthTokens } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly googleVerifier: GoogleVerifierService,
    private readonly users: UsersService,
    private readonly tokens: TokenService,
  ) {}

  async authenticateWithGoogle(idToken: string): Promise<AuthResponse> {
    const profile = await this.googleVerifier.verify(idToken);
    const user = await this.users.upsertFromGoogle(profile);
    const { accessToken, refreshToken } = await this.tokens.issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
    };
  }

  /** Rotates a refresh token into a fresh access + refresh pair. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    return this.tokens.rotate(refreshToken);
  }

  /** Revokes a refresh token. Idempotent; never leaks whether it existed. */
  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revoke(refreshToken);
  }
}
