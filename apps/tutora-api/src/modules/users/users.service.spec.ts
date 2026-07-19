import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@modules/mail/mail.service';
import { UsersService } from './users.service';
import type { GoogleProfile } from './users.types';

const profile: GoogleProfile = {
  googleId: 'google-sub-123',
  email: 'ada@example.com',
  emailVerified: true,
  name: 'Ada Lovelace',
  picture: 'https://img/avatar.png',
  locale: 'en',
};

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

const summaryUser = {
  id: 'u1',
  email: 'ada@example.com',
  name: 'Ada',
  avatarUrl: null,
  role: 'STUDENT' as const,
  onboardingCompleted: true,
  deletedAt: null,
  googleId: 'g1',
};

function buildMailMock() {
  return { sendWelcomeEmail: jest.fn().mockResolvedValue(undefined) };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>, mail = buildMailMock()) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      UsersService,
      { provide: PrismaService, useValue: prisma },
      { provide: MailService, useValue: mail },
    ],
  }).compile();
  return { service: moduleRef.get(UsersService), mail };
}

describe('UsersService.upsertFromGoogle', () => {
  it('returns the existing user when found by googleId', async () => {
    const prisma = buildPrismaMock();
    const existing = { id: 'u1', email: profile.email, googleId: profile.googleId };
    prisma.user.findUnique.mockResolvedValueOnce(existing);

    const { service, mail } = await buildService(prisma);
    const result = await service.upsertFromGoogle(profile);

    expect(result).toBe(existing);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(mail.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('links googleId to an existing user found by email', async () => {
    const prisma = buildPrismaMock();
    const byEmail = { id: 'u2', email: profile.email, googleId: null, name: null, avatarUrl: null };
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(byEmail);
    prisma.user.update.mockResolvedValueOnce({ ...byEmail, googleId: profile.googleId });

    const { service, mail } = await buildService(prisma);
    const result = await service.upsertFromGoogle(profile);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u2' },
      data: { googleId: profile.googleId, name: profile.name, avatarUrl: profile.picture },
    });
    expect(result.googleId).toBe(profile.googleId);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(mail.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('creates a new user with null role and sends the welcome email when none exists', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const created = {
      id: 'u3',
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      locale: profile.locale,
      role: null,
      onboardingCompleted: false,
    };
    prisma.user.create.mockResolvedValueOnce(created);

    const { service, mail } = await buildService(prisma);
    const result = await service.upsertFromGoogle(profile);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: profile.email,
        emailVerified: true,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.picture,
        locale: profile.locale,
        provider: 'GOOGLE',
      },
    });
    expect(result).toBe(created);
    expect(mail.sendWelcomeEmail).toHaveBeenCalledWith({
      email: profile.email,
      name: profile.name,
      locale: profile.locale,
    });
  });
});

describe('UsersService.getSummaryById', () => {
  it('returns a non-sensitive summary of an existing user', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce({ ...summaryUser });

    const { service } = await buildService(prisma);
    const result = await service.getSummaryById('u1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(result).toEqual({
      id: 'u1',
      email: 'ada@example.com',
      name: 'Ada',
      avatarUrl: null,
      role: 'STUDENT',
      onboardingCompleted: true,
    });
  });

  it('throws NotFoundException (fails closed) when the user does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const { service } = await buildService(prisma);
    await expect(service.getSummaryById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException for a soft-deleted account', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce({ ...summaryUser, deletedAt: new Date() });

    const { service } = await buildService(prisma);
    await expect(service.getSummaryById('u1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UsersService.updateMe', () => {
  it('sets the chosen role, completes onboarding, and returns the summary', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce({
      ...summaryUser,
      role: null,
      onboardingCompleted: false,
    });
    prisma.user.update.mockResolvedValueOnce({ ...summaryUser, role: 'TUTOR' });

    const { service } = await buildService(prisma);
    const result = await service.updateMe('u1', { role: 'TUTOR' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'TUTOR', onboardingCompleted: true },
    });
    expect(result).toMatchObject({ id: 'u1', role: 'TUTOR', onboardingCompleted: true });
  });

  it('rejects a role change once onboarding is already complete, protecting an out-of-band role like ADMIN from being overwritten', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce({
      ...summaryUser,
      role: 'ADMIN',
      onboardingCompleted: true,
    });

    const { service } = await buildService(prisma);

    await expect(service.updateMe('u1', { role: 'TUTOR' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException (fails closed) when choosing a role for a user that no longer exists', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const { service } = await buildService(prisma);

    await expect(service.updateMe('missing', { role: 'TUTOR' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('updates only the provided profile fields without touching onboarding', async () => {
    const prisma = buildPrismaMock();
    prisma.user.update.mockResolvedValueOnce({ ...summaryUser, name: 'Ada L.' });

    const { service } = await buildService(prisma);
    await service.updateMe('u1', { name: 'Ada L.', locale: 'az' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { name: 'Ada L.', locale: 'az' },
    });
  });

  it('is a no-op update (empty data) for an empty payload', async () => {
    const prisma = buildPrismaMock();
    prisma.user.update.mockResolvedValueOnce({ ...summaryUser });

    const { service } = await buildService(prisma);
    await service.updateMe('u1', {});

    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: {} });
  });
});

describe('UsersService.deactivateAccount', () => {
  it('soft-deletes the account and revokes outstanding refresh tokens atomically', async () => {
    const prisma = buildPrismaMock();

    const { service } = await buildService(prisma);
    await service.deactivateAccount('u1');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', revokedAt: null } }),
    );

    const updateCalls = prisma.user.update.mock.calls as Array<[{ data: { deletedAt: unknown } }]>;
    const revokeCalls = prisma.refreshToken.updateMany.mock.calls as Array<
      [{ data: { revokedAt: unknown } }]
    >;
    expect(updateCalls[0]?.[0]?.data.deletedAt).toBeInstanceOf(Date);
    expect(revokeCalls[0]?.[0]?.data.revokedAt).toBeInstanceOf(Date);
  });
});
