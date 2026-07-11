import { createHmac, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { parseDuration } from '@common/utils/parse-duration';
import type { AuthTokens } from '../types/auth.types';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Mints a short-lived access JWT plus an opaque refresh token. The refresh
   * token is returned to the caller once and stored only as an HMAC hash.
   */
  async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
      } as JwtSignOptions,
    );

    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + parseDuration(this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashRefreshToken(token: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_REFRESH_SECRET'))
      .update(token)
      .digest('hex');
  }
}
