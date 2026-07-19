import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { TutorRelationsService } from './tutor-relations.service';
import { TutorsService } from './tutors.service';

const PROFILE_VIEW = { id: 'tp1', userId: 'u1' };

function buildPrismaMock() {
  return {
    subject: { findUnique: jest.fn() },
    district: { findUnique: jest.fn() },
    language: { findUnique: jest.fn() },
    tutorSubject: { upsert: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    tutorDistrict: { upsert: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    tutorLanguage: { upsert: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    certificate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
}

function buildTutorsMock() {
  return {
    ensureProfile: jest.fn().mockResolvedValue({ id: 'tp1' }),
    viewByUserId: jest.fn().mockResolvedValue(PROFILE_VIEW),
  };
}

async function buildService(
  prisma: ReturnType<typeof buildPrismaMock>,
  tutors = buildTutorsMock(),
) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      TutorRelationsService,
      { provide: PrismaService, useValue: prisma },
      { provide: TutorsService, useValue: tutors },
    ],
  }).compile();
  return { service: moduleRef.get(TutorRelationsService), tutors };
}

describe('TutorRelationsService subjects', () => {
  it('upserts a subject that exists and returns the fresh profile view', async () => {
    const prisma = buildPrismaMock();
    prisma.subject.findUnique.mockResolvedValueOnce({ id: 's1' });

    const { service } = await buildService(prisma);
    const result = await service.upsertSubject('u1', {
      subjectId: 's1',
      pricingTiers: [{ period: 'HOURLY', amount: 30 }],
    });

    expect(prisma.tutorSubject.upsert).toHaveBeenCalledWith({
      where: { tutorId_subjectId: { tutorId: 'tp1', subjectId: 's1' } },
      create: {
        tutorId: 'tp1',
        subjectId: 's1',
        pricingTiers: { create: [{ tutorId: 'tp1', period: 'HOURLY', amount: 30 }] },
      },
      update: {
        pricingTiers: {
          deleteMany: {},
          create: [{ tutorId: 'tp1', period: 'HOURLY', amount: 30 }],
        },
      },
    });
    expect(result).toBe(PROFILE_VIEW);
  });

  it('rejects duplicate pricing tier periods with BadRequest', async () => {
    const prisma = buildPrismaMock();
    prisma.subject.findUnique.mockResolvedValueOnce({ id: 's1' });

    const { service } = await buildService(prisma);
    await expect(
      service.upsertSubject('u1', {
        subjectId: 's1',
        pricingTiers: [
          { period: 'HOURLY', amount: 30 },
          { period: 'HOURLY', amount: 40 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.tutorSubject.upsert).not.toHaveBeenCalled();
  });

  it('rejects a subject that does not exist with NotFound', async () => {
    const prisma = buildPrismaMock();
    prisma.subject.findUnique.mockResolvedValueOnce(null);

    const { service } = await buildService(prisma);
    await expect(service.upsertSubject('u1', { subjectId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.tutorSubject.upsert).not.toHaveBeenCalled();
  });

  it('removes an assigned subject', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorSubject.findUnique.mockResolvedValueOnce({ tutorId: 'tp1', subjectId: 's1' });

    const { service } = await buildService(prisma);
    await service.removeSubject('u1', 's1');

    expect(prisma.tutorSubject.delete).toHaveBeenCalledWith({
      where: { tutorId_subjectId: { tutorId: 'tp1', subjectId: 's1' } },
    });
  });

  it('rejects removing a subject that is not assigned', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorSubject.findUnique.mockResolvedValueOnce(null);

    const { service } = await buildService(prisma);
    await expect(service.removeSubject('u1', 's1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.tutorSubject.delete).not.toHaveBeenCalled();
  });
});

describe('TutorRelationsService certificates', () => {
  it('creates a PENDING certificate', async () => {
    const prisma = buildPrismaMock();
    const cert = {
      id: 'c1',
      title: 'IELTS',
      fileUrl: 'https://f',
      status: 'PENDING',
      issuedBy: 'BC',
      reviewedAt: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    prisma.certificate.create.mockResolvedValueOnce(cert);

    const { service } = await buildService(prisma);
    const result = await service.addCertificate('u1', {
      title: 'IELTS',
      fileUrl: 'https://f',
      issuedBy: 'BC',
    });

    expect(prisma.certificate.create).toHaveBeenCalledWith({
      data: { tutorId: 'tp1', title: 'IELTS', fileUrl: 'https://f', issuedBy: 'BC' },
    });
    expect(result).toMatchObject({ id: 'c1', status: 'PENDING' });
  });

  it('refuses to delete a certificate owned by another tutor', async () => {
    const prisma = buildPrismaMock();
    prisma.certificate.findUnique.mockResolvedValueOnce({ id: 'c1', tutorId: 'other' });

    const { service } = await buildService(prisma);
    await expect(service.removeCertificate('u1', 'c1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.certificate.delete).not.toHaveBeenCalled();
  });

  it('deletes an owned certificate', async () => {
    const prisma = buildPrismaMock();
    prisma.certificate.findUnique.mockResolvedValueOnce({ id: 'c1', tutorId: 'tp1' });

    const { service } = await buildService(prisma);
    await service.removeCertificate('u1', 'c1');

    expect(prisma.certificate.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
