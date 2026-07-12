import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/** Query for `GET /api/v1/admin/reviews` — pagination plus moderation filters. */
export class ListReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: 'Filter reviews for a single tutor.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  tutorId?: string;
}
