import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MAX_PRICING_TIERS } from './update-tutor-profile.dto';
import { PricingTierDto } from './pricing-tier.dto';

/**
 * Body of `PUT /api/v1/tutors/me/subjects`. Idempotently attaches a subject to
 * the tutor with optional per-subject pricing tiers that override the base rate.
 */
export class UpsertTutorSubjectDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  subjectId!: string;

  @ApiPropertyOptional({
    type: [PricingTierDto],
    description:
      'Replaces this subject’s price-override tiers with this set. Omit or send an empty array to fall back to the base rate for every period.',
  })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.common.isArray') })
  @ArrayMaxSize(MAX_PRICING_TIERS, {
    message: i18nValidationMessage('validation.common.arrayMaxSize'),
  })
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers?: PricingTierDto[];
}
