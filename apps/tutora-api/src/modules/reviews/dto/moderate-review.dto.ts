import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on the moderator's reason note. */
export const HIDDEN_REASON_MAX_LENGTH = 500;

/**
 * Body of `PATCH /api/v1/admin/reviews/:id/moderate`. Sets the review's
 * visibility; `hiddenReason` documents why a review was hidden or removed and
 * is cleared when a review is re-published.
 */
export class ModerateReviewDto {
  @ApiProperty({ enum: ReviewStatus })
  @IsEnum(ReviewStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status!: ReviewStatus;

  @ApiPropertyOptional({ maxLength: HIDDEN_REASON_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(HIDDEN_REASON_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  hiddenReason?: string;
}
