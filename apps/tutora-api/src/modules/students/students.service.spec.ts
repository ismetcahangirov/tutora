import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { StudentsService } from './students.service';

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sp1',
    userId: 'u1',
    bio: null,
    educationLevel: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    user: { name: 'Bob', avatarUrl: null, email: 'bob@example.com' },
    _count: { favorites: 0 },
    ...overrides,
  };
}

function buildPrismaMock() {
  return {
    studentProfile: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    favorite: {
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    tutorProfile: { findFirst: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [StudentsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(StudentsService);
}

function page(overrides: Partial<PaginationQueryDto> = {}): PaginationQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

describe('StudentsService.getOwnProfile', () => {
  it('creates an empty shell on first access', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(null);
    prisma.studentProfile.create.mockResolvedValueOnce(makeProfile());

    const service = await buildService(prisma);
    const result = await service.getOwnProfile('u1');

    expect(prisma.studentProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: 'u1' } }),
    );
    expect(result).toMatchObject({ id: 'sp1', favoritesCount: 0 });
  });
});

describe('StudentsService.updateOwnProfile', () => {
  it('updates only provided preference fields', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(makeProfile());
    prisma.studentProfile.update.mockResolvedValueOnce(
      makeProfile({ bio: 'Hi', educationLevel: 'UNIVERSITY' }),
    );

    const service = await buildService(prisma);
    await service.updateOwnProfile('u1', { bio: 'Hi', educationLevel: 'UNIVERSITY' });

    expect(prisma.studentProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        data: { bio: 'Hi', educationLevel: 'UNIVERSITY' },
      }),
    );
  });
});

describe('StudentsService favorites', () => {
  it('favorites a tutor that exists', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(makeProfile());
    prisma.tutorProfile.findFirst.mockResolvedValueOnce({ id: 'tp1' });

    const service = await buildService(prisma);
    await service.addFavorite('u1', 'tp1');

    expect(prisma.favorite.upsert).toHaveBeenCalledWith({
      where: { studentId_tutorId: { studentId: 'sp1', tutorId: 'tp1' } },
      create: { studentId: 'sp1', tutorId: 'tp1' },
      update: {},
    });
  });

  it('rejects favoriting a tutor that does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(makeProfile());
    prisma.tutorProfile.findFirst.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.addFavorite('u1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.favorite.upsert).not.toHaveBeenCalled();
  });

  it('removes a favorite idempotently', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(makeProfile());

    const service = await buildService(prisma);
    await service.removeFavorite('u1', 'tp1');

    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
      where: { studentId: 'sp1', tutorId: 'tp1' },
    });
  });

  it('lists favorites as a paginated envelope of tutor views', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(makeProfile());
    prisma.favorite.findMany.mockResolvedValueOnce([
      {
        createdAt: new Date('2026-02-01T00:00:00Z'),
        tutor: {
          id: 'tp1',
          hourlyRateCache: 25,
          currency: 'AZN',
          ratingAvg: 4.8,
          verificationStatus: 'VERIFIED',
          isPublished: true,
          user: { name: 'Ada', avatarUrl: null },
        },
      },
    ]);
    prisma.favorite.count.mockResolvedValueOnce(1);

    const service = await buildService(prisma);
    const result = await service.listFavorites('u1', page());

    expect(result.data[0]).toMatchObject({ tutorId: 'tp1', hourlyRate: 25, name: 'Ada' });
    expect(result.meta.total).toBe(1);
  });
});
