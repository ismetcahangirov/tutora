import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Rating scale bounds (inclusive). */
export const MIN_RATING = 1;
export const MAX_RATING = 5;
/** Upper bound on the free-text review comment. */
export const REVIEW_COMMENT_MAX_LENGTH = 2000;

/**
 * Body of `POST /api/v1/reviews`. The tutor and student are derived server-side
 * from the referenced application, so the client only supplies the application,
 * a star rating and an optional comment.
 */
export class CreateReviewDto {
  @ApiProperty({ description: 'The completed application being reviewed.' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  applicationId!: string;

  @ApiProperty({ minimum: MIN_RATING, maximum: MAX_RATING })
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(MIN_RATING, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_RATING, { message: i18nValidationMessage('validation.common.max') })
  rating!: number;

  @ApiPropertyOptional({ maxLength: REVIEW_COMMENT_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(REVIEW_COMMENT_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  comment?: string;
}
