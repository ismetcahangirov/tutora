import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
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
import {
  BODY_MAX_LENGTH,
  EXCERPT_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from './create-content-entry.dto';

/**
 * Body of `PATCH /admin/content/:id`. Every field is optional; only the ones
 * present are written. `type` and `locale` are immutable (they define the
 * entry's bucket), so they are absent here.
 */
export class UpdateContentEntryDto {
  @ApiPropertyOptional({ example: 'how-it-works' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(SLUG_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  @Matches(CONTENT_SLUG_PATTERN, { message: i18nValidationMessage('validation.common.slug') })
  slug?: string;

  @ApiPropertyOptional({ maxLength: TITLE_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(TITLE_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  title?: string;

  @ApiPropertyOptional({ maxLength: EXCERPT_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(EXCERPT_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  excerpt?: string;

  @ApiPropertyOptional({ maxLength: BODY_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(BODY_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  body?: string;

  @ApiPropertyOptional({ description: 'Absolute URL of a cover image.' })
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: i18nValidationMessage('validation.common.isUrl') })
  coverImageUrl?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status?: ContentStatus;
}
