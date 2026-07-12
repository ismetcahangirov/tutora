import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { NAME_MAX_LENGTH } from './update-me.dto';

/**
 * Body of `POST /api/v1/admin/users`. Provisions a shell account by email; the
 * user is linked to a real identity on their first Google sign-in
 * (`UsersService.upsertFromGoogle` matches by email). Unlike self-onboarding,
 * an admin may pre-assign any role, including ADMIN.
 */
export class AdminCreateUserDto {
  @ApiProperty()
  @IsEmail({}, { message: i18nValidationMessage('validation.common.isString') })
  email!: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.common.isEnum') })
  role?: UserRole;

  @ApiPropertyOptional({ maxLength: NAME_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(NAME_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  name?: string;

  @ApiPropertyOptional({ example: 'az' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(10, { message: i18nValidationMessage('validation.common.maxLength') })
  locale?: string;
}
