import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { SLUG_PATTERN } from './create-category.dto';

export class CreateDistrictDto {
  @ApiProperty({ maxLength: 120 })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(120, { message: i18nValidationMessage('validation.common.maxLength') })
  name!: string;

  @ApiProperty({ example: 'nasimi' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(120, { message: i18nValidationMessage('validation.common.maxLength') })
  @Matches(SLUG_PATTERN, { message: i18nValidationMessage('validation.common.slug') })
  slug!: string;
}
