import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Roles a user may assign to themselves during onboarding (#23). ADMIN is
 * granted out-of-band and is never self-selectable — presenting it fails
 * validation (400) so privilege escalation cannot happen through this endpoint.
 */
export const SELECTABLE_ROLES: readonly UserRole[] = [UserRole.STUDENT, UserRole.TUTOR];

/** Maximum length for the free-text display name. */
export const NAME_MAX_LENGTH = 120;

/**
 * Body of `PATCH /api/v1/users/me`. Every field is optional so the endpoint
 * serves both onboarding (send `role`) and ordinary profile edits (name, avatar,
 * locale). Setting `role` also completes onboarding; ADMIN is rejected here.
 */
export class UpdateMeDto {
  @ApiPropertyOptional({ enum: SELECTABLE_ROLES })
  @IsOptional()
  @IsIn(SELECTABLE_ROLES as UserRole[], {
    message: i18nValidationMessage('validation.role.invalid'),
  })
  role?: UserRole;

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
}
