import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** A lowercase, url-safe slug: letters, digits and hyphens. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

export class CreateCategoryDto {
  @ApiProperty({ maxLength: 120 })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(120, { message: i18nValidationMessage('validation.common.maxLength') })
  name!: string;

  @ApiProperty({ example: 'sciences' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(120, { message: i18nValidationMessage('validation.common.maxLength') })
  @Matches(SLUG_PATTERN, { message: i18nValidationMessage('validation.common.slug') })
  slug!: string;
}
