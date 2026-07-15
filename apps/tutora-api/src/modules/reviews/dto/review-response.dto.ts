import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { MAX_RATING, MIN_RATING } from './create-review.dto';

/**
 * Response shapes for the reviews endpoints. These mirror the projections in
 * `reviews.types.ts` (`ReviewView` & `AdminReviewView`) and exist so Swagger can
 * advertise the response schema — the TypeScript interfaces are erased at compile
 * time and are invisible to the OpenAPI generator.
 */

/** Public identity of a review's author. */
export class ReviewAuthorDto {
  @ApiProperty({ description: 'Author student profile id.' })
  id!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;
}

/**
 * Review projection for the student's own list and public tutor listings.
 * `status` is included so the author can see whether a review was moderated.
 */
export class ReviewViewDto {
  @ApiProperty({ description: 'Review id.' })
  id!: string;

  @ApiProperty({ minimum: MIN_RATING, maximum: MAX_RATING, description: 'Star rating.' })
  rating!: number;

  @ApiProperty({ nullable: true, type: String, description: 'Free-text comment, if any.' })
  comment!: string | null;

  @ApiProperty({ enum: ReviewStatus, enumName: 'ReviewStatus' })
  status!: ReviewStatus;

  @ApiProperty({ type: ReviewAuthorDto })
  author!: ReviewAuthorDto;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', type: String })
  updatedAt!: string;
}

/** Admin projection: the base view plus moderation metadata and the tutor. */
export class AdminReviewViewDto extends ReviewViewDto {
  @ApiProperty({ description: 'Reviewed tutor profile id.' })
  tutorId!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Reviewed tutor display name, if set.',
  })
  tutorName!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Why the review was hidden or removed, if moderated.',
  })
  hiddenReason!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Admin user id that last moderated the review, if any.',
  })
  moderatedById!: string | null;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'When the review was last moderated, if ever.',
  })
  moderatedAt!: string | null;
}
