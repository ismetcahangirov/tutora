import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminTutorsService } from './admin-tutors.service';
import { ListTutorsQueryDto } from './dto/list-tutors-query.dto';

function makeFullProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tp1',
    userId: 'u1',
    bio: null,
    experienceYears: 2,
    hourlyRate: 20,
    currency: 'AZN',
    formats: ['ONLINE'],
    verificationStatus: 'PENDING',
    ratingAvg: 4.5,
    ratingCount: 3,
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
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    certificate: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [AdminTutorsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(AdminTutorsService);
}

function query(overrides: Partial<ListTutorsQueryDto> = {}): ListTutorsQueryDto {
  return Object.assign(new ListTutorsQueryDto(), overrides);
}

describe('AdminTutorsService.list', () => {
  it('excludes soft-deleted profiles by default and returns slim rows', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findMany.mockResolvedValueOnce([
      {
        id: 'tp1',
        userId: 'u1',
        hourlyRate: 20,
        currency: 'AZN',
        verificationStatus: 'VERIFIED',
        isPublished: true,
        ratingAvg: 4.5,
        ratingCount: 3,
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        user: { name: 'Ada', email: 'ada@example.com', avatarUrl: null },
      },
    ]);
    prisma.tutorProfile.count.mockResolvedValueOnce(1);

    const service = await buildService(prisma);
    const result = await service.list(query());

    expect(prisma.tutorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } }),
    );
    expect(result.data[0]).toMatchObject({ id: 'tp1', email: 'ada@example.com', hourlyRate: 20 });
    expect(result.meta.total).toBe(1);
  });
});

describe('AdminTutorsService.setVerification', () => {
  it('unpublishes when the decision is not VERIFIED', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(makeFullProfile());
    prisma.tutorProfile.update.mockResolvedValueOnce(
      makeFullProfile({ verificationStatus: 'REJECTED', isPublished: false }),
    );

    const service = await buildService(prisma);
    await service.setVerification('tp1', { status: 'REJECTED' });

    expect(prisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tp1' },
        data: { verificationStatus: 'REJECTED', isPublished: false },
      }),
    );
  });

  it('does not force unpublish when the decision is VERIFIED', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(makeFullProfile());
    prisma.tutorProfile.update.mockResolvedValueOnce(
      makeFullProfile({ verificationStatus: 'VERIFIED' }),
    );

    const service = await buildService(prisma);
    await service.setVerification('tp1', { status: 'VERIFIED' });

    expect(prisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tp1' },
        data: { verificationStatus: 'VERIFIED' },
      }),
    );
  });
});

describe('AdminTutorsService.reviewCertificate', () => {
  it('rejects a certificate that belongs to a different tutor', async () => {
    const prisma = buildPrismaMock();
    prisma.certificate.findUnique.mockResolvedValueOnce({ id: 'c1', tutorId: 'other' });

    const service = await buildService(prisma);
    await expect(
      service.reviewCertificate('tp1', 'c1', { status: 'VERIFIED' }, 'admin-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.certificate.update).not.toHaveBeenCalled();
  });

  it('records the decision and stamps the reviewing admin', async () => {
    const prisma = buildPrismaMock();
    prisma.certificate.findUnique.mockResolvedValueOnce({ id: 'c1', tutorId: 'tp1' });
    prisma.certificate.update.mockResolvedValueOnce({
      id: 'c1',
      title: 'A',
      fileUrl: 'https://a',
      status: 'VERIFIED',
      issuedBy: null,
      reviewedAt: new Date('2026-02-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

    const service = await buildService(prisma);
    const result = await service.reviewCertificate('tp1', 'c1', { status: 'VERIFIED' }, 'admin-1');

    const calls = prisma.certificate.update.mock.calls as Array<
      [
        {
          where: { id: string };
          data: { status: string; reviewedById: string; reviewedAt: unknown };
        },
      ]
    >;
    const updateArg = calls[0]?.[0];
    expect(updateArg?.where).toEqual({ id: 'c1' });
    expect(updateArg?.data).toMatchObject({ status: 'VERIFIED', reviewedById: 'admin-1' });
    expect(updateArg?.data.reviewedAt).toBeInstanceOf(Date);
    expect(result.status).toBe('VERIFIED');
  });
});

describe('AdminTutorsService.getById', () => {
  it('throws NotFound for a missing profile', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
