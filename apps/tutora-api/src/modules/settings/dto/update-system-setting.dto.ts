import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { SETTING_DESCRIPTION_MAX_LENGTH } from './create-system-setting.dto';

/**
 * Body of `PATCH /admin/settings/:id`. Every field is optional; `key` is
 * immutable. When `value` is present it must be defined (any JSON shape); when
 * absent the stored value is left unchanged.
 */
export class UpdateSystemSettingDto {
  @ApiPropertyOptional({ description: 'Any JSON value.' })
  @IsOptional()
  // `value` may legitimately be `false`/`0`/`""`, so `@IsOptional` (which only
  // skips `undefined`/`null`) is the correct "omitted means unchanged" guard.
  @ValidateIf((_, value) => value !== undefined)
  @IsDefined({ message: i18nValidationMessage('validation.common.notEmpty') })
  value?: unknown;

  @ApiPropertyOptional({ maxLength: SETTING_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(SETTING_DESCRIPTION_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  description?: string;
}
