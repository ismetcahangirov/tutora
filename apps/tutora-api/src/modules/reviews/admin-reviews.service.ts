import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReviewStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import type { ModerateReviewDto } from './dto/moderate-review.dto';
import { ADMIN_REVIEW_INCLUDE, toAdminReviewView } from './reviews.mapper';
import { recomputeTutorRating } from './reviews.rating';
import type { AdminReviewView } from './reviews.types';

/**
 * Review moderation hooks (#33). Admins list reviews across the platform and
 * set their visibility. Hiding, removing or re-publishing a review recomputes
 * the affected tutor's rating in the same transaction, since only PUBLISHED
 * reviews count toward the public average.
 */
@Injectable()
export class AdminReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListReviewsQueryDto): Promise<Paginated<AdminReviewView>> {
    const where: Prisma.ReviewWhereInput = { deletedAt: null };
    if (query.status) {
      where.status = query.status;
    }
    if (query.tutorId) {
      where.tutorId = query.tutorId;
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: ADMIN_REVIEW_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.review.count({ where }),
    ]);
    return buildPage(rows.map(toAdminReviewView), total, query.page, query.limit);
  }

  /** Applies a moderation decision and stamps the acting admin. */
  async moderate(id: string, dto: ModerateReviewDto, adminId: string): Promise<AdminReviewView> {
    const existing = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tutorId: true },
    });
    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          status: dto.status,
          // A re-published review carries no hidden reason.
          hiddenReason: dto.status === ReviewStatus.PUBLISHED ? null : (dto.hiddenReason ?? null),
          moderatedById: adminId,
          moderatedAt: new Date(),
        },
        include: ADMIN_REVIEW_INCLUDE,
      });
      await recomputeTutorRating(tx, existing.tutorId);
      return updated;
    });
    return toAdminReviewView(review);
  }
}
