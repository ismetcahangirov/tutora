import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminReviewsService } from './admin-reviews.service';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';

function makeAdminReview(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rev1',
    rating: 5,
    comment: 'Great',
    status: 'HIDDEN',
    hiddenReason: 'spam',
    moderatedById: 'admin1',
    moderatedAt: new Date('2026-05-01T00:00:00Z'),
    createdAt: new Date('2026-04-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
    student: { id: 'sp1', user: { name: 'Bob', avatarUrl: null } },
    tutor: { id: 'tp1', user: { name: 'Ada' } },
    ...overrides,
  };
}

function buildPrismaMock() {
  const prisma = {
    review: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 5 }, _count: { _all: 1 } }),
    },
    tutorProfile: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );
  return prisma;
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [AdminReviewsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(AdminReviewsService);
}

function listQuery(overrides: Partial<ListReviewsQueryDto> = {}): ListReviewsQueryDto {
  return Object.assign(new ListReviewsQueryDto(), overrides);
}

describe('AdminReviewsService.moderate', () => {
  it('hides a review, stamps the admin and recomputes the rating', async () => {
    const prisma = buildPrismaMock();
    prisma.review.findFirst.mockResolvedValueOnce({ id: 'rev1', tutorId: 'tp1' });

    let updateArg:
      | {
          data: {
            status: string;
            hiddenReason: string | null;
            moderatedById: string;
            moderatedAt?: Date;
          };
        }
      | undefined;
    prisma.review.update.mockImplementationOnce((arg: unknown) => {
      updateArg = arg as typeof updateArg;
      return Promise.resolve(makeAdminReview());
    });

    const service = await buildService(prisma);
    const result = await service.moderate(
      'rev1',
      { status: 'HIDDEN', hiddenReason: 'spam' },
      'admin1',
    );

    expect(updateArg?.data.status).toBe('HIDDEN');
    expect(updateArg?.data.hiddenReason).toBe('spam');
    expect(updateArg?.data.moderatedById).toBe('admin1');
    expect(updateArg?.data.moderatedAt).toBeInstanceOf(Date);
    expect(prisma.tutorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tp1' } }),
    );
    expect(result).toMatchObject({ id: 'rev1', tutorId: 'tp1', status: 'HIDDEN' });
  });

  it('clears the hidden reason when a review is re-published', async () => {
    const prisma = buildPrismaMock();
    prisma.review.findFirst.mockResolvedValueOnce({ id: 'rev1', tutorId: 'tp1' });

    let updateArg: { data: { hiddenReason: string | null } } | undefined;
    prisma.review.update.mockImplementationOnce((arg: unknown) => {
      updateArg = arg as typeof updateArg;
      return Promise.resolve(makeAdminReview({ status: 'PUBLISHED', hiddenReason: null }));
    });

    const service = await buildService(prisma);
    await service.moderate('rev1', { status: 'PUBLISHED' }, 'admin1');

    expect(updateArg?.data.hiddenReason).toBeNull();
  });

  it('rejects moderating a non-existent review', async () => {
    const prisma = buildPrismaMock();
    prisma.review.findFirst.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(
      service.moderate('missing', { status: 'HIDDEN' }, 'admin1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AdminReviewsService.list', () => {
  it('filters by status and tutor and excludes soft-deleted reviews', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.list(listQuery({ status: 'HIDDEN', tutorId: 'tp1' }));

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, status: 'HIDDEN', tutorId: 'tp1' },
      }),
    );
  });
});
