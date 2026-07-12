import { ApiPropertyOptional } from '@nestjs/swagger';
import { LessonFormat } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/** Upper bound on the rating scale — mirrors the 1–5 stars used for reviews. */
export const MAX_RATING = 5;
/** Sanity cap on price filters so a single query can't ask for absurd ranges. */
export const MAX_SEARCH_PRICE = 100_000;
/** Cap on the free-text query length. */
export const SEARCH_QUERY_MAX_LENGTH = 120;

/** Sort orders exposed to the search UI. Defaults to best-rated first. */
export enum TutorSort {
  Rating = 'rating',
  PriceAsc = 'price_asc',
  PriceDesc = 'price_desc',
  Newest = 'newest',
}

/**
 * Query parameters for `GET /api/v1/search/tutors`. Extends the shared
 * pagination DTO and adds discovery filters (district, subject, language,
 * format, price band, minimum rating, free text) plus a sort order. Numeric
 * params are coerced from their string query representation and bounded.
 */
export class SearchTutorsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only tutors teaching this subject.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Only tutors serving this district.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  districtId?: string;

  @ApiPropertyOptional({ description: 'Only tutors speaking this language.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  languageId?: string;

  @ApiPropertyOptional({ enum: LessonFormat, description: 'Only tutors offering this format.' })
  @IsOptional()
  @IsEnum(LessonFormat, { message: i18nValidationMessage('validation.common.isEnum') })
  format?: LessonFormat;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_SEARCH_PRICE })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.common.isNumber') },
  )
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_SEARCH_PRICE, { message: i18nValidationMessage('validation.common.max') })
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_SEARCH_PRICE })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.common.isNumber') },
  )
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_SEARCH_PRICE, { message: i18nValidationMessage('validation.common.max') })
  maxPrice?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_RATING, description: 'Minimum average rating.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.common.isNumber') },
  )
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_RATING, { message: i18nValidationMessage('validation.common.max') })
  minRating?: number;

  @ApiPropertyOptional({ description: 'Free-text match on tutor name or bio.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(SEARCH_QUERY_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  q?: string;

  @ApiPropertyOptional({ enum: TutorSort, default: TutorSort.Rating })
  @IsOptional()
  @IsEnum(TutorSort, { message: i18nValidationMessage('validation.common.isEnum') })
  sort: TutorSort = TutorSort.Rating;
}
