import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CONFIG_KEY_PATTERN } from '../settings.types';

/** Longest a setting key may be. */
export const SETTING_KEY_MAX_LENGTH = 80;
/** Longest a description may be. */
export const SETTING_DESCRIPTION_MAX_LENGTH = 200;

/**
 * Body of `POST /admin/settings`. `value` is arbitrary JSON (scalar, array, or
 * object) so a setting can hold any shape without a schema change; the service
 * bounds its serialized size. `key` is the setting's immutable identity.
 */
export class CreateSystemSettingDto {
  @ApiProperty({ example: 'support_email' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(SETTING_KEY_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  @Matches(CONFIG_KEY_PATTERN, { message: i18nValidationMessage('validation.common.key') })
  key!: string;

  @ApiProperty({ description: 'Any JSON value.', example: 'support@tutora.app' })
  @IsDefined({ message: i18nValidationMessage('validation.common.notEmpty') })
  value!: unknown;

  @ApiPropertyOptional({ maxLength: SETTING_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(SETTING_DESCRIPTION_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  description?: string;
}
