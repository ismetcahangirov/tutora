import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminStudentsService } from './admin-students.service';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';

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
    _count: { favorites: 2 },
    ...overrides,
  };
}

function buildPrismaMock() {
  return {
    studentProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [AdminStudentsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(AdminStudentsService);
}

function query(overrides: Partial<ListStudentsQueryDto> = {}): ListStudentsQueryDto {
  return Object.assign(new ListStudentsQueryDto(), overrides);
}

describe('AdminStudentsService.list', () => {
  it('filters by education level and excludes deleted by default', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findMany.mockResolvedValueOnce([
      {
        id: 'sp1',
        userId: 'u1',
        educationLevel: 'UNIVERSITY',
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        user: { name: 'Bob', email: 'bob@example.com', avatarUrl: null },
        _count: { favorites: 2 },
      },
    ]);
    prisma.studentProfile.count.mockResolvedValueOnce(1);

    const service = await buildService(prisma);
    const result = await service.list(query({ educationLevel: 'UNIVERSITY' }));

    expect(prisma.studentProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null, educationLevel: 'UNIVERSITY' } }),
    );
    expect(result.data[0]).toMatchObject({
      id: 'sp1',
      email: 'bob@example.com',
      favoritesCount: 2,
    });
  });
});

describe('AdminStudentsService.getById / update', () => {
  it('throws NotFound for a missing profile', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applies provided fields on update', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(makeProfile());
    prisma.studentProfile.update.mockResolvedValueOnce(makeProfile({ bio: 'Updated' }));

    const service = await buildService(prisma);
    await service.update('sp1', { bio: 'Updated' });

    expect(prisma.studentProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sp1' }, data: { bio: 'Updated' } }),
    );
  });
});
