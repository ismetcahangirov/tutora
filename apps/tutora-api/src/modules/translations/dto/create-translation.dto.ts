import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TRANSLATION_KEY_PATTERN, TRANSLATION_NAMESPACE_PATTERN } from '../translations.types';
import { TranslationValuesDto } from './translation-values.dto';

/** Field length caps, mirrored by the admin form so it fails fast. */
export const NAMESPACE_MAX_LENGTH = 60;
export const KEY_MAX_LENGTH = 160;
export const DESCRIPTION_MAX_LENGTH = 300;

/**
 * Body of `POST /admin/translations`. `namespace` + `key` are the entry's
 * identity (unique together); `values` carries the per-locale copy.
 */
export class CreateTranslationDto {
  @ApiProperty({ example: 'search' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(NAMESPACE_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  @Matches(TRANSLATION_NAMESPACE_PATTERN, {
    message: i18nValidationMessage('validation.common.i18nKey'),
  })
  namespace!: string;

  @ApiProperty({ example: 'filter.district' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(KEY_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  @Matches(TRANSLATION_KEY_PATTERN, { message: i18nValidationMessage('validation.common.i18nKey') })
  key!: string;

  @ApiPropertyOptional({ maxLength: DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(DESCRIPTION_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  description?: string;

  @ApiPropertyOptional({ type: TranslationValuesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationValuesDto)
  values?: TranslationValuesDto;
}
