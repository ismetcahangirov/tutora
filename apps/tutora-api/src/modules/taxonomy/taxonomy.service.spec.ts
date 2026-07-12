import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { TaxonomyService } from './taxonomy.service';

function buildPrismaMock() {
  return {
    category: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    subject: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    district: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    language: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [TaxonomyService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(TaxonomyService);
}

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('boom', { code, clientVersion: '6.0.0' });
}

describe('TaxonomyService reads', () => {
  it('lists subjects filtered by category', async () => {
    const prisma = buildPrismaMock();
    prisma.subject.findMany.mockResolvedValueOnce([
      { id: 's1', name: 'Math', slug: 'math', categoryId: 'c1' },
    ]);

    const service = await buildService(prisma);
    const result = await service.listSubjects('c1');

    expect(prisma.subject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { categoryId: 'c1' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('lists all subjects when no category filter is given', async () => {
    const prisma = buildPrismaMock();
    prisma.subject.findMany.mockResolvedValueOnce([]);

    const service = await buildService(prisma);
    await service.listSubjects();

    expect(prisma.subject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });
});

describe('TaxonomyService write error mapping', () => {
  it('maps a unique-constraint violation (P2002) to Conflict', async () => {
    const prisma = buildPrismaMock();
    prisma.category.create.mockRejectedValueOnce(knownError('P2002'));

    const service = await buildService(prisma);
    await expect(service.createCategory({ name: 'X', slug: 'x' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('maps a missing-row error (P2025) to NotFound', async () => {
    const prisma = buildPrismaMock();
    prisma.district.delete.mockRejectedValueOnce(knownError('P2025'));

    const service = await buildService(prisma);
    await expect(service.deleteDistrict('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a language and returns the view on success', async () => {
    const prisma = buildPrismaMock();
    prisma.language.create.mockResolvedValueOnce({ id: 'l1', name: 'Azerbaijani', code: 'az' });

    const service = await buildService(prisma);
    const result = await service.createLanguage({ name: 'Azerbaijani', code: 'az' });

    expect(result).toEqual({ id: 'l1', name: 'Azerbaijani', code: 'az' });
  });
});
