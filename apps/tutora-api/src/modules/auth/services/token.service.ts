import { createHmac, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { RefreshToken, User } from '@prisma/client';
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
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.persistRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  /**
   * Exchanges a valid refresh token for a brand-new access + refresh pair
   * (rotation). The presented token is invalidated so it cannot be reused.
   *
   * Fails closed with 401 for any invalid state and never reveals which one:
   * unknown hash, expired, or already revoked. An already-revoked token means
   * the raw token was replayed after rotation — treated as a compromise, so
   * every currently-active token for that user is revoked.
   */
  async rotate(rawRefreshToken: string): Promise<AuthTokens> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(rawRefreshToken) },
    });

    if (!record) {
      throw new UnauthorizedException();
    }

    if (record.revokedAt) {
      await this.revokeAllForUser(record.userId);
      throw new UnauthorizedException();
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException();
    }

    await this.markRevoked(record);

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user);
  }

  /**
   * Revokes a refresh token (logout). Idempotent and non-leaking: an unknown or
   * already-revoked token resolves silently without signalling its existence.
   */
  async revoke(rawRefreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashRefreshToken(rawRefreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async signAccessToken(user: User): Promise<string> {
    return this.jwt.signAsync(
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
  }

  /** Creates a fresh opaque refresh token, stores only its hash, returns the raw. */
  private async persistRefreshToken(userId: string): Promise<string> {
    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + parseDuration(this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return refreshToken;
  }

  private async markRevoked(record: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashRefreshToken(token: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_REFRESH_SECRET'))
      .update(token)
      .digest('hex');
  }
}
