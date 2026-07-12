import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, Prisma, ReviewStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import type { CreateReviewDto } from './dto/create-review.dto';
import type { UpdateReviewDto } from './dto/update-review.dto';
import { REVIEW_INCLUDE, toReviewView } from './reviews.mapper';
import { recomputeTutorRating } from './reviews.rating';
import type { ReviewView } from './reviews.types';

/**
 * Post-session reviews and ratings (#33). A student may review a tutor exactly
 * once per completed application; each write recomputes the tutor's
 * denormalised rating aggregate in the same transaction. Public reads expose
 * only PUBLISHED reviews.
 */
@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a review for a completed application the caller owns. The tutor is
   * derived from the application — never trusted from the client. The unique
   * `(studentId, applicationId)` index enforces one review per session; a
   * duplicate surfaces as a 409.
   */
  async create(userId: string, dto: CreateReviewDto): Promise<ReviewView> {
    const studentId = await this.ensureStudentProfileId(userId);

    const application = await this.prisma.application.findFirst({
      where: { id: dto.applicationId, studentId },
      select: { id: true, tutorId: true, status: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== ApplicationStatus.COMPLETED) {
      throw new ConflictException('You can only review a completed session');
    }

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            studentId,
            tutorId: application.tutorId,
            applicationId: application.id,
            rating: dto.rating,
            comment: dto.comment ?? null,
          },
          include: REVIEW_INCLUDE,
        });
        await recomputeTutorRating(tx, application.tutorId);
        return created;
      });
      return toReviewView(review);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already reviewed this session');
      }
      throw error;
    }
  }

  /** The caller's own reviews, newest first. Soft-deleted reviews are hidden. */
  async listForStudent(userId: string, query: PaginationQueryDto): Promise<Paginated<ReviewView>> {
    const studentId = await this.ensureStudentProfileId(userId);
    const where: Prisma.ReviewWhereInput = { studentId, deletedAt: null };
    return this.paginate(where, query);
  }

  /** Public list of a tutor's PUBLISHED reviews, newest first. */
  async listForTutor(tutorId: string, query: PaginationQueryDto): Promise<Paginated<ReviewView>> {
    const where: Prisma.ReviewWhereInput = {
      tutorId,
      status: ReviewStatus.PUBLISHED,
      deletedAt: null,
    };
    return this.paginate(where, query);
  }

  /** The author edits their own review; a rating change recomputes the average. */
  async update(userId: string, id: string, dto: UpdateReviewDto): Promise<ReviewView> {
    const studentId = await this.ensureStudentProfileId(userId);
    const existing = await this.prisma.review.findFirst({
      where: { id, studentId, deletedAt: null },
      select: { id: true, tutorId: true },
    });
    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    const data: Prisma.ReviewUpdateInput = {};
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.comment !== undefined) data.comment = dto.comment;

    const review = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({ where: { id }, data, include: REVIEW_INCLUDE });
      await recomputeTutorRating(tx, existing.tutorId);
      return updated;
    });
    return toReviewView(review);
  }

  /** The author removes their own review (soft delete), recomputing the average. */
  async remove(userId: string, id: string): Promise<void> {
    const studentId = await this.ensureStudentProfileId(userId);
    const existing = await this.prisma.review.findFirst({
      where: { id, studentId, deletedAt: null },
      select: { id: true, tutorId: true },
    });
    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id },
        data: { deletedAt: new Date(), status: ReviewStatus.REMOVED },
      });
      await recomputeTutorRating(tx, existing.tutorId);
    });
  }

  private async paginate(
    where: Prisma.ReviewWhereInput,
    query: PaginationQueryDto,
  ): Promise<Paginated<ReviewView>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: REVIEW_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.review.count({ where }),
    ]);
    return buildPage(rows.map(toReviewView), total, query.page, query.limit);
  }

  /**
   * Resolves the caller's student profile id, creating an empty profile on
   * first use. Handles the concurrent-first-write race via the unique index.
   */
  private async ensureStudentProfileId(userId: string): Promise<string> {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    try {
      const created = await this.prisma.studentProfile.create({
        data: { userId },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.studentProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (raced) return raced.id;
      }
      throw error;
    }
  }
}
