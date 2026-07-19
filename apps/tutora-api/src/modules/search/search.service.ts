import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import { SearchTutorsQueryDto, TutorSort } from './dto/search-tutors-query.dto';
import { TUTOR_SEARCH_SELECT, toTutorSearchItem } from './search.mapper';
import type { TutorSearchItem } from './search.types';

/**
 * Public tutor discovery (#31). Filters the marketplace of published tutors by
 * district, subject, language, format, price band, minimum rating and free
 * text, then paginates and sorts. Every filter column is indexed at the schema
 * level (hourlyRateCache, ratingAvg, verificationStatus+isPublished, and the
 * join tables), so the query stays cheap as the catalogue grows. Price
 * filtering/sorting reads `hourlyRateCache` — a denormalized mirror of the
 * tutor's HOURLY PricingTier, kept in sync on write (#178) so this can stay a
 * plain indexed column instead of a per-row subquery into PricingTier.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchTutors(query: SearchTutorsQueryDto): Promise<Paginated<TutorSearchItem>> {
    const where = this.buildWhere(query);
    const orderBy = this.orderFor(query.sort);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tutorProfile.findMany({
        where,
        select: TUTOR_SEARCH_SELECT,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.tutorProfile.count({ where }),
    ]);

    return buildPage(rows.map(toTutorSearchItem), total, query.page, query.limit);
  }

  /**
   * Only VERIFIED, published, non-deleted profiles are discoverable. The base
   * predicate rides the `[verificationStatus, isPublished]` composite index;
   * each optional filter narrows further.
   */
  private buildWhere(query: SearchTutorsQueryDto): Prisma.TutorProfileWhereInput {
    const where: Prisma.TutorProfileWhereInput = {
      verificationStatus: 'VERIFIED',
      isPublished: true,
      deletedAt: null,
    };

    if (query.subjectId) where.subjects = { some: { subjectId: query.subjectId } };
    if (query.districtId) where.districts = { some: { districtId: query.districtId } };
    if (query.languageId) where.languages = { some: { languageId: query.languageId } };
    if (query.format) where.formats = { has: query.format };

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.hourlyRateCache = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.minRating !== undefined) where.ratingAvg = { gte: query.minRating };

    if (query.q) {
      where.OR = [
        { user: { name: { contains: query.q, mode: 'insensitive' } } },
        { bio: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Maps the sort option to a stable, tie-broken Prisma ordering. Price sorts
   * push tutors with no HOURLY rate set to the back regardless of direction —
   * an unpriced tutor isn't meaningfully "cheapest" or "priciest".
   */
  private orderFor(sort: TutorSort): Prisma.TutorProfileOrderByWithRelationInput[] {
    switch (sort) {
      case TutorSort.PriceAsc:
        return [
          { hourlyRateCache: { sort: 'asc', nulls: 'last' } },
          { ratingAvg: 'desc' },
          { id: 'asc' },
        ];
      case TutorSort.PriceDesc:
        return [
          { hourlyRateCache: { sort: 'desc', nulls: 'last' } },
          { ratingAvg: 'desc' },
          { id: 'asc' },
        ];
      case TutorSort.Newest:
        return [{ createdAt: 'desc' }, { id: 'asc' }];
      case TutorSort.Rating:
      default:
        return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }, { id: 'asc' }];
    }
  }
}
