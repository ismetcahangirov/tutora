import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
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
import { MAX_PLAN_PRICE, PLAN_NAME_MAX_LENGTH } from './create-plan.dto';
import { PlanEntitlementsDto } from './plan-entitlements.dto';

/**
 * Body of `PATCH /api/v1/admin/plans/:id`. All fields optional. `tier` is the
 * plan's identity and is deliberately absent — retire a plan (`isActive: false`)
 * and create a new one instead of re-tiering an existing plan.
 */
export class UpdatePlanDto {
  @ApiPropertyOptional({ maxLength: PLAN_NAME_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.common.notEmpty') })
  @MaxLength(PLAN_NAME_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  name?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_PLAN_PRICE })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.common.isNumber') },
  )
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_PLAN_PRICE, { message: i18nValidationMessage('validation.common.max') })
  priceMonthly?: number;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  isActive?: boolean;
}
