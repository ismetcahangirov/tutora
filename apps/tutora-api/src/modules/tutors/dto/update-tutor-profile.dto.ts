import { ApiPropertyOptional } from '@nestjs/swagger';
import { LessonFormat } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on the free-text bio. */
export const BIO_MAX_LENGTH = 2000;
/** Sanity caps so obviously invalid values are rejected at the boundary. */
export const MAX_EXPERIENCE_YEARS = 80;
export const MAX_HOURLY_RATE = 100_000;

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

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_HOURLY_RATE })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.common.isNumber') },
  )
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_HOURLY_RATE, { message: i18nValidationMessage('validation.common.max') })
  hourlyRate?: number;

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
