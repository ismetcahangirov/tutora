import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CONFIG_KEY_PATTERN } from '../settings.types';

/** Longest a flag key may be. */
export const FLAG_KEY_MAX_LENGTH = 80;
/** Longest a description may be. */
export const FLAG_DESCRIPTION_MAX_LENGTH = 200;
/** Rollout is a whole percentage. */
export const MIN_ROLLOUT = 0;
export const MAX_ROLLOUT = 100;

/** Body of `POST /admin/feature-flags`. `key` is the flag's immutable identity. */
export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'in_app_payments' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(FLAG_KEY_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  @Matches(CONFIG_KEY_PATTERN, { message: i18nValidationMessage('validation.common.key') })
  key!: string;

  @ApiPropertyOptional({ maxLength: FLAG_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(FLAG_DESCRIPTION_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: MIN_ROLLOUT, maximum: MAX_ROLLOUT, default: 0 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(MIN_ROLLOUT, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_ROLLOUT, { message: i18nValidationMessage('validation.common.max') })
  rolloutPercentage?: number;
}
