import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on a single localized string, mirrored by the admin form. */
export const TRANSLATION_VALUE_MAX_LENGTH = 2000;

/**
 * Per-locale copy for a translation key (#85). Every locale is optional so a key
 * can be created in one language and completed later. The supported locales
 * (az/en/ru) are explicit fields, since they are a deliberate, stable set.
 */
export class TranslationValuesDto {
  @ApiPropertyOptional({ maxLength: TRANSLATION_VALUE_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(TRANSLATION_VALUE_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  az?: string;

  @ApiPropertyOptional({ maxLength: TRANSLATION_VALUE_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(TRANSLATION_VALUE_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  en?: string;

  @ApiPropertyOptional({ maxLength: TRANSLATION_VALUE_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(TRANSLATION_VALUE_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  ru?: string;
}
