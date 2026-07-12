import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Sanity cap so a numeric override can't be set to an absurd limit. */
export const MAX_ENTITLEMENT_LIMIT = 100_000;

/**
 * Optional overrides persisted on a plan (`Plan.entitlements`). Every field is
 * optional; any omitted field falls back to the tier baseline at read time (see
 * `resolveEntitlements`). Validated so a bad override is rejected at the
 * boundary rather than silently ignored later.
 */
export class PlanEntitlementsDto {
  @ApiPropertyOptional({ minimum: 0, maximum: MAX_ENTITLEMENT_LIMIT })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_ENTITLEMENT_LIMIT, { message: i18nValidationMessage('validation.common.max') })
  maxActiveApplications?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_ENTITLEMENT_LIMIT })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_ENTITLEMENT_LIMIT, { message: i18nValidationMessage('validation.common.max') })
  maxFavorites?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  featuredProfile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  analytics?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  prioritySupport?: boolean;
}
