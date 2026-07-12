import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Body of `PUT /api/v1/tutors/me/languages` — attaches a spoken language. */
export class AddTutorLanguageDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  languageId!: string;
}
