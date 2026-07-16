import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import type { GoogleProfile } from '@modules/users/users.types';

@Injectable()
export class GoogleVerifierService {
  private readonly logger = new Logger(GoogleVerifierService.name);
  private readonly client = new OAuth2Client();
  private readonly audience: string;

  constructor(private readonly config: ConfigService) {
    this.audience = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.audience });
      payload = ticket.getPayload();
    } catch (error) {
      // The client only needs a generic 401, but swallowing the real cause hides
      // config/clock/cert problems in production. Log the underlying reason (e.g.
      // "audience != requiredAudience", "Token used too late", cert fetch failure)
      // alongside the expected audience so operators can diagnose from the logs.
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Google ID token verification failed (expected aud=${this.audience}): ${reason}`,
      );
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload?.email || payload.email_verified !== true) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: true,
      name: payload.name,
      picture: payload.picture,
      locale: payload.locale,
    };
  }
}
