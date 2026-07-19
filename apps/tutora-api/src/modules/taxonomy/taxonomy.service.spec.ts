import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';
import { TaxonomyService } from './taxonomy.service';

function buildPrismaMock() {
  return {
    category: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    subject: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    city: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    district: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    language: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
}

// getOrSet runs the loader (cache miss) so read tests still exercise Prisma;
// individual tests can override to simulate a hit.
function buildCacheMock() {
  return {
    getOrSet: jest.fn((_key: string, _ttl: number, loader: () => Promise<unknown>) => loader()),
    deleteByPrefix: jest.fn().mockResolvedValue(undefined),
  };
}

async function buildService(
  prisma: ReturnType<typeof buildPrismaMock>,
  cache: ReturnType<typeof buildCacheMock> = buildCacheMock(),
) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      TaxonomyService,
      { provide: PrismaService, useValue: prisma },
      { provide: CacheService, useValue: cache },
    ],
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

  it('lists districts filtered by city', async () => {
    const prisma = buildPrismaMock();
    prisma.district.findMany.mockResolvedValueOnce([
      { id: 'd1', name: 'Nasimi', slug: 'nasimi', cityId: 'c1' },
    ]);

    const service = await buildService(prisma);
    const result = await service.listDistricts('c1');

    expect(prisma.district.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cityId: 'c1' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('lists all districts when no city filter is given', async () => {
    const prisma = buildPrismaMock();
    prisma.district.findMany.mockResolvedValueOnce([]);

    const service = await buildService(prisma);
    await service.listDistricts();

    expect(prisma.district.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });
});

describe('TaxonomyService caching', () => {
  it('reads categories through the cache under a stable key', async () => {
    const prisma = buildPrismaMock();
    prisma.category.findMany.mockResolvedValueOnce([]);
    const cache = buildCacheMock();

    const service = await buildService(prisma, cache);
    await service.listCategories();

    expect(cache.getOrSet).toHaveBeenCalledWith(
      'taxonomy:categories',
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('keys subject lists by category so filters do not collide', async () => {
    const prisma = buildPrismaMock();
    prisma.subject.findMany.mockResolvedValue([]);
    const cache = buildCacheMock();

    const service = await buildService(prisma, cache);
    await service.listSubjects('c1');
    await service.listSubjects();

    expect(cache.getOrSet).toHaveBeenCalledWith(
      'taxonomy:subjects:c1',
      expect.any(Number),
      expect.any(Function),
    );
    expect(cache.getOrSet).toHaveBeenCalledWith(
      'taxonomy:subjects',
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('serves a cache hit without touching Prisma', async () => {
    const prisma = buildPrismaMock();
    const cache = buildCacheMock();
    cache.getOrSet.mockResolvedValueOnce([{ id: 'd1', name: 'Nasimi', slug: 'nasimi' }]);

    const service = await buildService(prisma, cache);
    const result = await service.listDistricts();

    expect(result).toEqual([{ id: 'd1', name: 'Nasimi', slug: 'nasimi' }]);
    expect(prisma.district.findMany).not.toHaveBeenCalled();
  });

  it('keys district lists by city so filters do not collide', async () => {
    const prisma = buildPrismaMock();
    prisma.district.findMany.mockResolvedValue([]);
    const cache = buildCacheMock();

    const service = await buildService(prisma, cache);
    await service.listDistricts('c1');
    await service.listDistricts();

    expect(cache.getOrSet).toHaveBeenCalledWith(
      'taxonomy:districts:c1',
      expect.any(Number),
      expect.any(Function),
    );
    expect(cache.getOrSet).toHaveBeenCalledWith(
      'taxonomy:districts',
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('invalidates the taxonomy namespace after a successful write', async () => {
    const prisma = buildPrismaMock();
    prisma.language.create.mockResolvedValueOnce({ id: 'l1', name: 'English', code: 'en' });
    const cache = buildCacheMock();

    const service = await buildService(prisma, cache);
    await service.createLanguage({ name: 'English', code: 'en' });

    expect(cache.deleteByPrefix).toHaveBeenCalledWith('taxonomy:');
  });

  it('does not invalidate the cache when a write fails', async () => {
    const prisma = buildPrismaMock();
    prisma.category.create.mockRejectedValueOnce(knownError('P2002'));
    const cache = buildCacheMock();

    const service = await buildService(prisma, cache);
    await expect(service.createCategory({ name: 'X', slug: 'x' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(cache.deleteByPrefix).not.toHaveBeenCalled();
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

  it('maps a bad-foreign-key error (P2003) to BadRequest when a district references an unknown city', async () => {
    const prisma = buildPrismaMock();
    prisma.district.create.mockRejectedValueOnce(knownError('P2003'));

    const service = await buildService(prisma);
    await expect(
      service.createDistrict({ name: 'Nasimi', slug: 'nasimi', cityId: 'missing' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a city and returns the view on success', async () => {
    const prisma = buildPrismaMock();
    prisma.city.create.mockResolvedValueOnce({ id: 'c1', name: 'Baku', slug: 'baku' });

    const service = await buildService(prisma);
    const result = await service.createCity({ name: 'Baku', slug: 'baku' });

    expect(result).toEqual({ id: 'c1', name: 'Baku', slug: 'baku' });
  });

  it('creates a language and returns the view on success', async () => {
    const prisma = buildPrismaMock();
    prisma.language.create.mockResolvedValueOnce({ id: 'l1', name: 'Azerbaijani', code: 'az' });

    const service = await buildService(prisma);
    const result = await service.createLanguage({ name: 'Azerbaijani', code: 'az' });

    expect(result).toEqual({ id: 'l1', name: 'Azerbaijani', code: 'az' });
  });
});
