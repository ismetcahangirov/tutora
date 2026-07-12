import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MAX_RATING, MIN_RATING, REVIEW_COMMENT_MAX_LENGTH } from './create-review.dto';

/**
 * Body of `PATCH /api/v1/reviews/:id`. Both fields optional so a student can
 * revise the rating, the comment, or both. Editing recomputes the tutor's
 * average when the rating changes.
 */
export class UpdateReviewDto {
  @ApiPropertyOptional({ minimum: MIN_RATING, maximum: MAX_RATING })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(MIN_RATING, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_RATING, { message: i18nValidationMessage('validation.common.max') })
  rating?: number;

  @ApiPropertyOptional({ maxLength: REVIEW_COMMENT_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(REVIEW_COMMENT_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  comment?: string;
}
