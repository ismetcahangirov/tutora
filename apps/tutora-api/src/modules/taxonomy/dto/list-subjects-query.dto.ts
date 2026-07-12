import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Query for `GET /api/v1/subjects` — optional filter by owning category. */
export class ListSubjectsQueryDto {
  @ApiPropertyOptional({ description: 'Filter subjects by owning category id.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  categoryId?: string;
}
