import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { TutorsService } from './tutors.service';

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tp1',
    userId: 'u1',
    bio: null,
    experienceYears: 0,
    hourlyRate: 0,
    currency: 'AZN',
    formats: [],
    verificationStatus: 'UNVERIFIED',
    ratingAvg: 0,
    ratingCount: 0,
    profileViews: 0,
    isPublished: false,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    user: { name: 'Ada', avatarUrl: null, email: 'ada@example.com' },
    subjects: [],
    districts: [],
    languages: [],
    certificates: [],
    ...overrides,
  };
}

function buildPrismaMock() {
  return {
    tutorProfile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [TutorsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(TutorsService);
}

describe('TutorsService.getOwnProfile', () => {
  it('maps an existing profile to the view', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(makeProfile());

    const service = await buildService(prisma);
    const result = await service.getOwnProfile('u1');

    expect(result).toMatchObject({ id: 'tp1', userId: 'u1', name: 'Ada', hourlyRate: 0 });
    expect(prisma.tutorProfile.create).not.toHaveBeenCalled();
  });

  it('creates an empty shell on first access', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(null);
    prisma.tutorProfile.create.mockResolvedValueOnce(makeProfile());

    const service = await buildService(prisma);
    await service.getOwnProfile('u1');

    expect(prisma.tutorProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: 'u1', hourlyRate: 0 } }),
    );
  });
});

describe('TutorsService.updateOwnProfile', () => {
  it('rejects publishing an unverified profile with Conflict', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(makeProfile());

    const service = await buildService(prisma);
    await expect(service.updateOwnProfile('u1', { isPublished: true })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.tutorProfile.update).not.toHaveBeenCalled();
  });

  it('publishes when the profile is verified', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(
      makeProfile({ verificationStatus: 'VERIFIED' }),
    );
    prisma.tutorProfile.update.mockResolvedValueOnce(
      makeProfile({ verificationStatus: 'VERIFIED', isPublished: true }),
    );

    const service = await buildService(prisma);
    const result = await service.updateOwnProfile('u1', { isPublished: true });

    expect(result.isPublished).toBe(true);
    expect(prisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, data: { isPublished: true } }),
    );
  });

  it('maps scalar-list formats through a set operation', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(makeProfile());
    prisma.tutorProfile.update.mockResolvedValueOnce(makeProfile({ formats: ['ONLINE'] }));

    const service = await buildService(prisma);
    await service.updateOwnProfile('u1', { formats: ['ONLINE'], bio: 'Hi' });

    expect(prisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        data: { bio: 'Hi', formats: { set: ['ONLINE'] } },
      }),
    );
  });
});

describe('TutorsService.submitForVerification', () => {
  it('moves an UNVERIFIED profile to PENDING', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(makeProfile());
    prisma.tutorProfile.update.mockResolvedValueOnce(
      makeProfile({ verificationStatus: 'PENDING' }),
    );

    const service = await buildService(prisma);
    const result = await service.submitForVerification('u1');

    expect(result.verificationStatus).toBe('PENDING');
    expect(prisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        data: { verificationStatus: 'PENDING' },
      }),
    );
  });

  it('is a no-op when already PENDING', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(
      makeProfile({ verificationStatus: 'PENDING' }),
    );

    const service = await buildService(prisma);
    await service.submitForVerification('u1');

    expect(prisma.tutorProfile.update).not.toHaveBeenCalled();
  });

  it('rejects resubmission of a VERIFIED profile', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(
      makeProfile({ verificationStatus: 'VERIFIED' }),
    );

    const service = await buildService(prisma);
    await expect(service.submitForVerification('u1')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('TutorsService.getPublicById', () => {
  it('returns a public view and hides unverified certificates', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findFirst.mockResolvedValueOnce(
      makeProfile({
        isPublished: true,
        verificationStatus: 'VERIFIED',
        certificates: [
          {
            id: 'c1',
            title: 'A',
            fileUrl: 'https://a',
            status: 'VERIFIED',
            issuedBy: null,
            reviewedAt: null,
            createdAt: new Date(),
          },
          {
            id: 'c2',
            title: 'B',
            fileUrl: 'https://b',
            status: 'PENDING',
            issuedBy: null,
            reviewedAt: null,
            createdAt: new Date(),
          },
        ],
      }),
    );

    const service = await buildService(prisma);
    const result = await service.getPublicById('tp1');

    expect(prisma.tutorProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tp1', isPublished: true, deletedAt: null } }),
    );
    expect(result.certificates).toHaveLength(1);
    expect(result.certificates[0]?.id).toBe('c1');
    expect(result).not.toHaveProperty('profileViews');
  });

  it('throws NotFound for an unpublished or missing tutor', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findFirst.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.getPublicById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
