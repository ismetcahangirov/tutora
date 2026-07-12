import { ApiPropertyOptional } from '@nestjs/swagger';
import { EducationLevel } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { toBoolean } from '@common/transforms/to-boolean';

/** Query parameters for `GET /api/v1/admin/students` — pagination plus filters. */
export class ListStudentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel, { message: i18nValidationMessage('validation.common.isEnum') })
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ description: 'Case-insensitive match on student name or email.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(120, { message: i18nValidationMessage('validation.common.maxLength') })
  q?: string;

  @ApiPropertyOptional({ description: 'Include soft-deleted profiles.', default: false })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  includeDeleted?: boolean = false;
}
