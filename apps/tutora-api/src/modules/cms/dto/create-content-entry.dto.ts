import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, ContentType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CONTENT_SLUG_PATTERN } from '../cms.types';

/** Field length caps, mirrored by the admin form so it fails fast. */
export const SLUG_MAX_LENGTH = 120;
export const LOCALE_MAX_LENGTH = 10;
export const TITLE_MAX_LENGTH = 200;
export const EXCERPT_MAX_LENGTH = 300;
export const BODY_MAX_LENGTH = 20000;

/**
 * Body of `POST /admin/content`. `type` and `locale` place the entry in a
 * bucket; `slug` is its identity within that bucket (unique per type+locale).
 */
export class CreateContentEntryDto {
  @ApiProperty({ enum: ContentType })
  @IsEnum(ContentType, { message: i18nValidationMessage('validation.common.isEnum') })
  type!: ContentType;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(LOCALE_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  locale?: string;

  @ApiProperty({ example: 'how-it-works' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(SLUG_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  @Matches(CONTENT_SLUG_PATTERN, { message: i18nValidationMessage('validation.common.slug') })
  slug!: string;

  @ApiProperty({ maxLength: TITLE_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(TITLE_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  title!: string;

  @ApiPropertyOptional({ maxLength: EXCERPT_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(EXCERPT_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  excerpt?: string;

  @ApiProperty({ maxLength: BODY_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(BODY_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  body!: string;

  @ApiPropertyOptional({ description: 'Absolute URL of a cover image.' })
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: i18nValidationMessage('validation.common.isUrl') })
  coverImageUrl?: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status?: ContentStatus;
}
