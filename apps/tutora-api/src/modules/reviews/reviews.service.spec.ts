import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { ReviewsService } from './reviews.service';

function makeReview(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rev1',
    rating: 5,
    comment: 'Great',
    status: 'PUBLISHED',
    createdAt: new Date('2026-04-01T00:00:00Z'),
    updatedAt: new Date('2026-04-01T00:00:00Z'),
    student: { id: 'sp1', user: { name: 'Bob', avatarUrl: null } },
    ...overrides,
  };
}

function buildPrismaMock() {
  const prisma = {
    studentProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'sp1' }), create: jest.fn() },
    application: { findFirst: jest.fn() },
    review: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: { _all: 2 } }),
    },
    tutorProfile: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  // Supports both the array form (list endpoints) and the interactive callback
  // form (write + rating recompute). Wired after the literal so the callback can
  // reference the fully-typed mock without a self-referential initializer.
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );
  return prisma;
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(ReviewsService);
}

function page(overrides: Partial<PaginationQueryDto> = {}): PaginationQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

describe('ReviewsService.create', () => {
  it('reviews a completed application and recomputes the tutor rating', async () => {
    const prisma = buildPrismaMock();
    prisma.application.findFirst.mockResolvedValueOnce({
      id: 'app1',
      tutorId: 'tp1',
      status: 'COMPLETED',
    });
    prisma.review.create.mockResolvedValueOnce(makeReview());

    const service = await buildService(prisma);
    const result = await service.create('u1', { applicationId: 'app1', rating: 5 });

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { studentId: 'sp1', tutorId: 'tp1', applicationId: 'app1', rating: 5, comment: null },
      }),
    );
    // Rating recompute ran in the same transaction.
    expect(prisma.review.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tutorId: 'tp1', status: 'PUBLISHED', deletedAt: null } }),
    );
    expect(prisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tp1' }, data: { ratingCount: 2, ratingAvg: 4.5 } }),
    );
    expect(result).toMatchObject({ id: 'rev1', rating: 5 });
  });

  it('refuses to review a session that is not completed', async () => {
    const prisma = buildPrismaMock();
    prisma.application.findFirst.mockResolvedValueOnce({
      id: 'app1',
      tutorId: 'tp1',
      status: 'ACCEPTED',
    });

    const service = await buildService(prisma);
    await expect(service.create('u1', { applicationId: 'app1', rating: 5 })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it('rejects reviewing an application the student does not own', async () => {
    const prisma = buildPrismaMock();
    prisma.application.findFirst.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(
      service.create('u1', { applicationId: 'foreign', rating: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps a duplicate-review unique violation to 409', async () => {
    const prisma = buildPrismaMock();
    prisma.application.findFirst.mockResolvedValueOnce({
      id: 'app1',
      tutorId: 'tp1',
      status: 'COMPLETED',
    });
    prisma.review.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );

    const service = await buildService(prisma);
    await expect(service.create('u1', { applicationId: 'app1', rating: 5 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('ReviewsService.remove', () => {
  it('soft-deletes the review and recomputes the rating', async () => {
    const prisma = buildPrismaMock();
    prisma.review.findFirst.mockResolvedValueOnce({ id: 'rev1', tutorId: 'tp1' });

    let updateArg:
      { where: { id: string }; data: { status: string; deletedAt?: Date } } | undefined;
    prisma.review.update.mockImplementationOnce((arg: unknown) => {
      updateArg = arg as typeof updateArg;
      return Promise.resolve({});
    });

    const service = await buildService(prisma);
    await service.remove('u1', 'rev1');

    expect(updateArg?.where).toEqual({ id: 'rev1' });
    expect(updateArg?.data.status).toBe('REMOVED');
    expect(updateArg?.data.deletedAt).toBeInstanceOf(Date);
    expect(prisma.tutorProfile.update).toHaveBeenCalled();
  });

  it('rejects removing a review the student does not own', async () => {
    const prisma = buildPrismaMock();
    prisma.review.findFirst.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.remove('u1', 'rev1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ReviewsService.listForTutor', () => {
  it('only lists published, non-deleted reviews', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.listForTutor('tp1', page());

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tutorId: 'tp1', status: 'PUBLISHED', deletedAt: null },
      }),
    );
  });
});
