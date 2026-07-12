import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Lowercase language code such as `az`, `en`, `ru`. */
export const LANGUAGE_CODE_PATTERN = /^[a-z]{2,10}$/;

export class CreateLanguageDto {
  @ApiProperty({ maxLength: 120 })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(120, { message: i18nValidationMessage('validation.common.maxLength') })
  name!: string;

  @ApiProperty({ example: 'az' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @Matches(LANGUAGE_CODE_PATTERN, { message: i18nValidationMessage('validation.common.slug') })
  code!: string;
}
