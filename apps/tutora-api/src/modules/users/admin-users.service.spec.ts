import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminUsersService } from './admin-users.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

function fullUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'ada@example.com',
    emailVerified: false,
    name: 'Ada',
    avatarUrl: null,
    locale: 'az',
    provider: 'GOOGLE',
    googleId: 'g1',
    role: 'STUDENT',
    onboardingCompleted: true,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [AdminUsersService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(AdminUsersService);
}

function query(overrides: Partial<ListUsersQueryDto> = {}): ListUsersQueryDto {
  return Object.assign(new ListUsersQueryDto(), overrides);
}

describe('AdminUsersService.list', () => {
  it('excludes soft-deleted accounts by default and paginates', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findMany.mockResolvedValueOnce([fullUser()]);
    prisma.user.count.mockResolvedValueOnce(1);

    const service = await buildService(prisma);
    const result = await service.list(query({ page: 1, limit: 20 }));

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null }, skip: 0, take: 20 }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).not.toHaveProperty('googleId');
    expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('applies role and case-insensitive text filters and includes deleted when asked', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findMany.mockResolvedValueOnce([]);
    prisma.user.count.mockResolvedValueOnce(0);

    const service = await buildService(prisma);
    await service.list(query({ role: 'TUTOR', q: 'ada', includeDeleted: true }));

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: 'TUTOR',
          OR: [
            { email: { contains: 'ada', mode: 'insensitive' } },
            { name: { contains: 'ada', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });
});

describe('AdminUsersService.getById', () => {
  it('returns the admin view for an existing user', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(fullUser());

    const service = await buildService(prisma);
    const result = await service.getById('u1');

    expect(result.id).toBe('u1');
    expect(result).not.toHaveProperty('googleId');
  });

  it('throws NotFound when the user is absent', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AdminUsersService.create', () => {
  it('rejects a duplicate email with Conflict', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(fullUser());

    const service = await buildService(prisma);
    await expect(service.create({ email: 'ada@example.com' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('provisions a shell account and completes onboarding when a role is given', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce(
      fullUser({ role: 'TUTOR', onboardingCompleted: true }),
    );

    const service = await buildService(prisma);
    await service.create({ email: 'new@example.com', role: 'TUTOR', name: 'Neo' });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        role: 'TUTOR',
        name: 'Neo',
        locale: undefined,
        onboardingCompleted: true,
      },
    });
  });
});

describe('AdminUsersService.update / softDelete / restore', () => {
  it('applies only provided fields on update', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(fullUser());
    prisma.user.update.mockResolvedValueOnce(fullUser({ role: 'ADMIN' }));

    const service = await buildService(prisma);
    await service.update('u1', { role: 'ADMIN', emailVerified: true });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'ADMIN', emailVerified: true },
    });
  });

  it('soft-deletes and revokes refresh tokens', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(fullUser());

    const service = await buildService(prisma);
    await service.softDelete('u1');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
    const calls = prisma.user.update.mock.calls as Array<[{ data: { deletedAt: unknown } }]>;
    expect(calls[0]?.[0]?.data.deletedAt).toBeInstanceOf(Date);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it('restores by clearing deletedAt', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(fullUser({ deletedAt: new Date() }));
    prisma.user.update.mockResolvedValueOnce(fullUser());

    const service = await buildService(prisma);
    await service.restore('u1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { deletedAt: null },
    });
  });

  it('throws NotFound when updating a missing user', async () => {
    const prisma = buildPrismaMock();
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.update('missing', { name: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
