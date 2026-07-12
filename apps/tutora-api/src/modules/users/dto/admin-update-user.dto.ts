import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { NAME_MAX_LENGTH } from './update-me.dto';

/**
 * Body of `PATCH /api/v1/admin/users/:id`. Every field is optional (partial
 * update). An admin may set any role — including ADMIN — and toggle lifecycle
 * flags an ordinary user cannot change about themselves.
 */
export class AdminUpdateUserDto {
  @ApiPropertyOptional({ maxLength: NAME_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(NAME_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: i18nValidationMessage('validation.common.isUrl') })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'az' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(10, { message: i18nValidationMessage('validation.common.maxLength') })
  locale?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.common.isEnum') })
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  emailVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  onboardingCompleted?: boolean;
}
