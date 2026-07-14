import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditCategory } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/** Upper bound on the free-text query so a single filter can't be unbounded. */
const QUERY_MAX_LENGTH = 120;

/**
 * Query parameters for the audit-log listing (#71). Extends the shared
 * pagination DTO and adds category, a free-text match (over action and actor
 * email), and an inclusive `createdAt` date window.
 */
export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: AuditCategory })
  @IsOptional()
  @IsEnum(AuditCategory, { message: i18nValidationMessage('validation.common.isEnum') })
  category?: AuditCategory;

  @ApiPropertyOptional({ description: 'Case-insensitive match on action or actor email.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(QUERY_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  q?: string;

  @ApiPropertyOptional({ description: 'Lower bound (inclusive) on the entry timestamp, ISO 8601.' })
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.common.isDateString') })
  from?: string;

  @ApiPropertyOptional({ description: 'Upper bound (inclusive) on the entry timestamp, ISO 8601.' })
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.common.isDateString') })
  to?: string;
}
