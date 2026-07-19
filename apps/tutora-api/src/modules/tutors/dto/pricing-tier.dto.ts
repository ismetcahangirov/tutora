import { ApiProperty } from '@nestjs/swagger';
import { PricingPeriod } from '@prisma/client';
import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Sanity cap so an obviously invalid amount is rejected at the boundary, at any billing period. */
export const MAX_PRICING_AMOUNT = 100_000;

/** One (period → amount) price point, e.g. an hourly or a monthly rate (#178). */
export class PricingTierDto {
  @ApiProperty({ enum: PricingPeriod, enumName: 'PricingPeriod' })
  @IsEnum(PricingPeriod, { message: i18nValidationMessage('validation.common.isEnum') })
  period!: PricingPeriod;

  @ApiProperty({ minimum: 0, maximum: MAX_PRICING_AMOUNT })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.common.isNumber') },
  )
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_PRICING_AMOUNT, { message: i18nValidationMessage('validation.common.max') })
  amount!: number;
}
