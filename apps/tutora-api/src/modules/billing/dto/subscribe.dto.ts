import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on the provider identifier / reference echoed onto the payment. */
export const PROVIDER_MAX_LENGTH = 40;
export const PROVIDER_REF_MAX_LENGTH = 200;

/**
 * Body of `POST /api/v1/billing/subscribe`. The caller picks a plan by `tier`
 * (tiers are unique); `provider`/`providerRef` carry the gateway's identifiers
 * for the charge when a client initiates payment out of band.
 */
export class SubscribeDto {
  @ApiProperty({ enum: PlanTier })
  @IsEnum(PlanTier, { message: i18nValidationMessage('validation.common.isEnum') })
  tier!: PlanTier;

  @ApiPropertyOptional({ description: 'Payment provider identifier (e.g. "stripe").' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(PROVIDER_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  provider?: string;

  @ApiPropertyOptional({ description: 'Provider-side reference for the charge.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(PROVIDER_REF_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  providerRef?: string;
}
