import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { SearchTutorsQueryDto, TutorSort } from './dto/search-tutors-query.dto';
import { SearchService } from './search.service';

function buildPrismaMock() {
  return {
    tutorProfile: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [SearchService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(SearchService);
}

function query(overrides: Partial<SearchTutorsQueryDto> = {}): SearchTutorsQueryDto {
  return Object.assign(new SearchTutorsQueryDto(), overrides);
}

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tp1',
    bio: 'Experienced maths tutor',
    experienceYears: 5,
    hourlyRate: 30,
    currency: 'AZN',
    formats: ['ONLINE'],
    verificationStatus: 'VERIFIED',
    ratingAvg: 4.7,
    ratingCount: 12,
    user: { name: 'Ada', avatarUrl: null },
    subjects: [{ subjectId: 's1', subject: { name: 'Maths', slug: 'maths' } }],
    districts: [{ districtId: 'd1', district: { name: 'Nasimi', slug: 'nasimi' } }],
    languages: [{ languageId: 'l1', language: { name: 'Azerbaijani', code: 'az' } }],
    ...overrides,
  };
}

describe('SearchService.searchTutors', () => {
  it('always constrains to verified, published, non-deleted tutors', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.searchTutors(query());

    expect(prisma.tutorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { verificationStatus: 'VERIFIED', isPublished: true, deletedAt: null },
      }),
    );
  });

  it('translates every filter into the matching Prisma predicate', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.searchTutors(
      query({
        subjectId: 's1',
        districtId: 'd1',
        languageId: 'l1',
        format: 'ONLINE' as never,
        minPrice: 10,
        maxPrice: 50,
        minRating: 4,
        q: 'ada',
      }),
    );

    expect(prisma.tutorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          verificationStatus: 'VERIFIED',
          isPublished: true,
          deletedAt: null,
          subjects: { some: { subjectId: 's1' } },
          districts: { some: { districtId: 'd1' } },
          languages: { some: { languageId: 'l1' } },
          formats: { has: 'ONLINE' },
          hourlyRate: { gte: 10, lte: 50 },
          ratingAvg: { gte: 4 },
          OR: [
            { user: { name: { contains: 'ada', mode: 'insensitive' } } },
            { bio: { contains: 'ada', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('supports an open-ended price band (min only)', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.searchTutors(query({ minPrice: 20 }));

    expect(prisma.tutorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          verificationStatus: 'VERIFIED',
          isPublished: true,
          deletedAt: null,
          hourlyRate: { gte: 20 },
        },
      }),
    );
  });

  it('orders by price ascending when requested', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.searchTutors(query({ sort: TutorSort.PriceAsc }));

    expect(prisma.tutorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ hourlyRate: 'asc' }, { ratingAvg: 'desc' }, { id: 'asc' }],
      }),
    );
  });

  it('defaults to best-rated first and maps rows to search items', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findMany.mockResolvedValueOnce([makeRow()]);
    prisma.tutorProfile.count.mockResolvedValueOnce(1);
    const service = await buildService(prisma);

    const result = await service.searchTutors(query());

    expect(prisma.tutorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }, { id: 'asc' }],
      }),
    );
    expect(result.meta.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      id: 'tp1',
      name: 'Ada',
      hourlyRate: 30,
      ratingAvg: 4.7,
      subjects: [{ subjectId: 's1', name: 'Maths', slug: 'maths' }],
    });
  });
});
