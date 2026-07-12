import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MAX_HOURLY_RATE } from './update-tutor-profile.dto';

/**
 * Body of `PUT /api/v1/tutors/me/subjects`. Idempotently attaches a subject to
 * the tutor with an optional per-subject price that overrides the base rate.
 */
export class UpsertTutorSubjectDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  subjectId!: string;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_HOURLY_RATE })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.common.isNumber') },
  )
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_HOURLY_RATE, { message: i18nValidationMessage('validation.common.max') })
  priceOverride?: number;
}
