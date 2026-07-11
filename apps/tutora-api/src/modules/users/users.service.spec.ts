import { NotFoundException } from '@nestjs/common';
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
  };
}

const summaryUser = {
  id: 'u1',
  email: 'ada@example.com',
  name: 'Ada',
  avatarUrl: null,
  role: 'STUDENT' as const,
  onboardingCompleted: true,
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
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'ada@example.com',
      name: 'Ada',
      avatarUrl: null,
      role: 'STUDENT',
      onboardingCompleted: true,
      googleId: 'g1',
    });

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
});

describe('UsersService.completeOnboarding', () => {
  it('sets the chosen role, marks onboarding complete, and returns the summary', async () => {
    const prisma = buildPrismaMock();
    prisma.user.update.mockResolvedValueOnce({
      ...summaryUser,
      role: 'TUTOR',
      onboardingCompleted: true,
    });

    const { service } = await buildService(prisma);
    const result = await service.completeOnboarding('u1', 'TUTOR');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'TUTOR', onboardingCompleted: true },
    });
    expect(result).toEqual({
      id: 'u1',
      email: 'ada@example.com',
      name: 'Ada',
      avatarUrl: null,
      role: 'TUTOR',
      onboardingCompleted: true,
    });
  });
});
