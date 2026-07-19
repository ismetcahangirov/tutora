import { ApiPropertyOptional } from '@nestjs/swagger';
import { LessonFormat } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PricingTierDto } from './pricing-tier.dto';

/** Upper bound on the free-text bio. */
export const BIO_MAX_LENGTH = 2000;
/** Sanity cap so an obviously invalid value is rejected at the boundary. */
export const MAX_EXPERIENCE_YEARS = 80;
/** One tier per billing period, at most. */
export const MAX_PRICING_TIERS = 4;

/**
 * Body of `PUT/PATCH /api/v1/tutors/me`. All fields optional so the same DTO
 * serves both the initial fill and later partial edits. `verificationStatus`
 * is deliberately absent — a tutor cannot self-verify; they submit for review
 * (`POST /tutors/me/verification`) and an admin decides.
 */
export class UpdateTutorProfileDto {
  @ApiPropertyOptional({ maxLength: BIO_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(BIO_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  bio?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_EXPERIENCE_YEARS })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_EXPERIENCE_YEARS, { message: i18nValidationMessage('validation.common.max') })
  experienceYears?: number;

  @ApiPropertyOptional({
    type: [PricingTierDto],
    description: 'Replaces the base pricing tiers (one per billing period) with this set.',
  })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.common.isArray') })
  @ArrayMaxSize(MAX_PRICING_TIERS, {
    message: i18nValidationMessage('validation.common.arrayMaxSize'),
  })
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers?: PricingTierDto[];

  @ApiPropertyOptional({ example: 'AZN' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @Length(3, 3, { message: i18nValidationMessage('validation.common.isCurrency') })
  currency?: string;

  @ApiPropertyOptional({ enum: LessonFormat, isArray: true })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.common.isArray') })
  @IsEnum(LessonFormat, { each: true, message: i18nValidationMessage('validation.common.isEnum') })
  formats?: LessonFormat[];

  @ApiPropertyOptional({ description: 'Publishing requires a VERIFIED profile.' })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  isPublished?: boolean;
}
