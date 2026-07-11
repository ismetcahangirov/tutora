import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenService } from './token.service';
import type { User } from '@prisma/client';

const CONFIG: Record<string, string> = {
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'refresh-secret',
  JWT_REFRESH_EXPIRES_IN: '7d',
};

const user = {
  id: 'user-1',
  email: 'ada@example.com',
  role: null,
  onboardingCompleted: false,
} as unknown as User;

function build() {
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.access.jwt') };
  const config = { getOrThrow: jest.fn((key: string) => CONFIG[key]) };
  const prisma = { refreshToken: { create: jest.fn().mockResolvedValue({}) } };
  const service = new TokenService(
    jwt as unknown as JwtService,
    config as unknown as ConfigService,
    prisma as unknown as PrismaService,
  );
  return { service, jwt, prisma };
}

describe('TokenService.issueTokens', () => {
  it('signs an access token with the user claims', async () => {
    const { service, jwt } = build();
    await service.issueTokens(user);

    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', email: 'ada@example.com', role: null, onboardingCompleted: false },
      { secret: 'access-secret', expiresIn: '15m' },
    );
  });

  it('persists the refresh token only as an HMAC hash, never in plaintext', async () => {
    const { service, prisma } = build();
    const { refreshToken } = await service.issueTokens(user);

    interface RefreshTokenCreateData {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    }
    const createArg = (
      prisma.refreshToken.create.mock.calls[0] as [{ data: RefreshTokenCreateData }]
    )[0].data;
    const expectedHash = createHmac('sha256', 'refresh-secret').update(refreshToken).digest('hex');

    expect(createArg.userId).toBe('user-1');
    expect(createArg.tokenHash).toBe(expectedHash);
    expect(createArg.tokenHash).not.toBe(refreshToken);
    expect(createArg.expiresAt).toBeInstanceOf(Date);
    expect(createArg.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns the signed access token and a non-empty opaque refresh token', async () => {
    const { service } = build();
    const tokens = await service.issueTokens(user);

    expect(tokens.accessToken).toBe('signed.access.jwt');
    expect(typeof tokens.refreshToken).toBe('string');
    expect(tokens.refreshToken.length).toBeGreaterThan(20);
  });

  it('sets the refresh-token expiry to now + JWT_REFRESH_EXPIRES_IN', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      const { service, prisma } = build();
      await service.issueTokens(user);

      interface RefreshTokenCreateData {
        expiresAt: Date;
      }
      const createArg = (
        prisma.refreshToken.create.mock.calls[0] as [{ data: RefreshTokenCreateData }]
      )[0].data;
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      expect(createArg.expiresAt.getTime()).toBe(Date.now() + SEVEN_DAYS_MS);
    } finally {
      jest.useRealTimers();
    }
  });

  it('propagates a populated role and onboarding flag into the access-token claims', async () => {
    const { service, jwt } = build();
    const onboarded = {
      id: 'user-2',
      email: 'grace@example.com',
      role: 'STUDENT',
      onboardingCompleted: true,
    } as unknown as User;

    await service.issueTokens(onboarded);

    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'user-2', email: 'grace@example.com', role: 'STUDENT', onboardingCompleted: true },
      { secret: 'access-secret', expiresIn: '15m' },
    );
  });

  it('returns a distinct refresh token on each call', async () => {
    const { service } = build();
    const first = await service.issueTokens(user);
    const second = await service.issueTokens(user);
    expect(first.refreshToken).not.toBe(second.refreshToken);
  });
});
