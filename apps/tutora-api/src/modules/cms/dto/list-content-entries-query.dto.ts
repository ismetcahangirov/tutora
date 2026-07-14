import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, ContentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/** Upper bound on the free-text query so a single filter can't be unbounded. */
const QUERY_MAX_LENGTH = 120;
const LOCALE_MAX_LENGTH = 10;

/**
 * Query parameters for the admin content listing (#67). Extends pagination and
 * adds bucket filters (type, locale, status) plus a free-text match over title
 * and slug.
 */
export class ListContentEntriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ContentType })
  @IsOptional()
  @IsEnum(ContentType, { message: i18nValidationMessage('validation.common.isEnum') })
  type?: ContentType;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(LOCALE_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  locale?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Case-insensitive match on title or slug.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(QUERY_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  q?: string;
}
