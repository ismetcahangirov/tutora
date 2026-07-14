import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { FLAG_DESCRIPTION_MAX_LENGTH, MAX_ROLLOUT, MIN_ROLLOUT } from './create-feature-flag.dto';

/**
 * Body of `PATCH /admin/feature-flags/:id`. Every field is optional; `key` is
 * immutable and cannot be changed after creation.
 */
export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ maxLength: FLAG_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(FLAG_DESCRIPTION_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: MIN_ROLLOUT, maximum: MAX_ROLLOUT })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(MIN_ROLLOUT, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_ROLLOUT, { message: i18nValidationMessage('validation.common.max') })
  rolloutPercentage?: number;
}
