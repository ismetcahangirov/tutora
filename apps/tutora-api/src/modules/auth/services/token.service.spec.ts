import { createHmac } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
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
  name: 'Ada',
  avatarUrl: null,
  role: null,
  onboardingCompleted: false,
} as unknown as User;

function hash(token: string): string {
  return createHmac('sha256', 'refresh-secret').update(token).digest('hex');
}

function build() {
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.access.jwt') };
  const config = { getOrThrow: jest.fn((key: string) => CONFIG[key]) };
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
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

describe('TokenService.rotate', () => {
  const activeRow = {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: hash('old-refresh'),
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
  };

  it('revokes the presented row and issues a fresh access + refresh pair', async () => {
    const { service, prisma } = build();
    prisma.refreshToken.findUnique.mockResolvedValue(activeRow);

    const tokens = await service.rotate('old-refresh');

    // The presented token is looked up by its HMAC hash, never in plaintext.
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hash('old-refresh') },
    });
    // The presented row is marked revoked.
    const updateArg = (
      prisma.refreshToken.update.mock.calls[0] as [
        { where: { id: string }; data: { revokedAt: Date } },
      ]
    )[0];
    expect(updateArg.where).toEqual({ id: 'rt-1' });
    expect(updateArg.data.revokedAt).toBeInstanceOf(Date);
    // A brand-new refresh token row is persisted and a new pair returned.
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(tokens.accessToken).toBe('signed.access.jwt');
    expect(tokens.refreshToken).not.toBe('old-refresh');
    expect(tokens.refreshToken.length).toBeGreaterThan(20);
  });

  it('detects reuse: a already-revoked token bulk-revokes the user active tokens and throws', async () => {
    const { service, prisma } = build();
    prisma.refreshToken.findUnique.mockResolvedValue({
      ...activeRow,
      revokedAt: new Date(Date.now() - 1_000),
    });

    await expect(service.rotate('old-refresh')).rejects.toBeInstanceOf(UnauthorizedException);

    const revokeAllArg = (
      prisma.refreshToken.updateMany.mock.calls[0] as [
        { where: { userId: string; revokedAt: null }; data: { revokedAt: Date } },
      ]
    )[0];
    expect(revokeAllArg.where).toEqual({ userId: 'user-1', revokedAt: null });
    expect(revokeAllArg.data.revokedAt).toBeInstanceOf(Date);
    // No new pair is minted on a compromise.
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('throws for an unknown token hash and never issues tokens', async () => {
    const { service, prisma } = build();
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(service.rotate('ghost')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('throws for an expired token and never issues tokens', async () => {
    const { service, prisma } = build();
    prisma.refreshToken.findUnique.mockResolvedValue({
      ...activeRow,
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(service.rotate('old-refresh')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('throws when the owning user no longer exists', async () => {
    const { service, prisma } = build();
    prisma.refreshToken.findUnique.mockResolvedValue(activeRow);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.rotate('old-refresh')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('TokenService.revoke', () => {
  it('marks the matching active token revoked and reports success', async () => {
    const { service, prisma } = build();
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await service.revoke('some-refresh');

    const revokeArg = (
      prisma.refreshToken.updateMany.mock.calls[0] as [
        { where: { tokenHash: string; revokedAt: null }; data: { revokedAt: Date } },
      ]
    )[0];
    expect(revokeArg.where).toEqual({ tokenHash: hash('some-refresh'), revokedAt: null });
    expect(revokeArg.data.revokedAt).toBeInstanceOf(Date);
  });

  it('is idempotent and never throws for an unknown token', async () => {
    const { service, prisma } = build();
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.revoke('ghost')).resolves.toBeUndefined();
  });
});
