import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { toBoolean } from '@common/transforms/to-boolean';

/** Query parameters for `GET /api/v1/admin/users` — pagination plus filters. */
export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.common.isEnum') })
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Case-insensitive match on email or name.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(120, { message: i18nValidationMessage('validation.common.maxLength') })
  q?: string;

  @ApiPropertyOptional({ description: 'Include soft-deleted accounts.', default: false })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  includeDeleted?: boolean = false;
}
