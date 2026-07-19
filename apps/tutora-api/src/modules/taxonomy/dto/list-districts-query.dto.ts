import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Query for `GET /api/v1/districts` — optional filter by owning city. */
export class ListDistrictsQueryDto {
  @ApiPropertyOptional({ description: 'Filter districts by owning city id.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  cityId?: string;
}
