import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@common/pagination/page';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { ReviewsService } from './reviews.service';
import type { ReviewView } from './reviews.types';

/**
 * Public list of a tutor's published reviews (#33). Unauthenticated — this is
 * the social proof shown on a tutor's public profile. The two-segment path
 * (`/tutors/:tutorId/reviews`) never collides with the `/tutors/:id` detail
 * route.
 */
@ApiTags('reviews')
@Controller({ path: 'tutors/:tutorId/reviews', version: '1' })
export class TutorReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List a tutor’s published reviews (paginated)' })
  list(
    @Param('tutorId') tutorId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<ReviewView>> {
    return this.reviews.listForTutor(tutorId, query);
  }
}
