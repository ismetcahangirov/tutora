import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PlanEntitlementsDto } from './plan-entitlements.dto';

/** Upper bound on a plan's display name. */
export const PLAN_NAME_MAX_LENGTH = 60;
/** Sanity cap so an obviously invalid price is rejected at the boundary. */
export const MAX_PLAN_PRICE = 100_000;

/**
 * Body of `POST /api/v1/admin/plans`. `tier` is the plan's identity and is
 * unique — creating a second plan for an existing tier is a 409.
 */
export class CreatePlanDto {
  @ApiProperty({ enum: PlanTier })
  @IsEnum(PlanTier, { message: i18nValidationMessage('validation.common.isEnum') })
  tier!: PlanTier;

  @ApiProperty({ maxLength: PLAN_NAME_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.common.notEmpty') })
  @MaxLength(PLAN_NAME_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  name!: string;

  @ApiProperty({ minimum: 0, maximum: MAX_PLAN_PRICE })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.common.isNumber') },
  )
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_PLAN_PRICE, { message: i18nValidationMessage('validation.common.max') })
  priceMonthly!: number;

  @ApiPropertyOptional({ example: 'AZN' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @Length(3, 3, { message: i18nValidationMessage('validation.common.isCurrency') })
  currency?: string;

  @ApiPropertyOptional({ type: PlanEntitlementsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanEntitlementsDto)
  entitlements?: PlanEntitlementsDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  isActive?: boolean;
}
