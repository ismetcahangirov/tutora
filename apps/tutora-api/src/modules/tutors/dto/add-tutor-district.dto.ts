import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Body of `PUT /api/v1/tutors/me/districts` — attaches a service district. */
export class AddTutorDistrictDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  districtId!: string;
}
