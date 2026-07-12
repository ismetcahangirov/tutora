import { ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { toBoolean } from '@common/transforms/to-boolean';

/** Query parameters for `GET /api/v1/admin/tutors` — pagination plus filters. */
export class ListTutorsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Case-insensitive match on tutor name or email.' })
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
