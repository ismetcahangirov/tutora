import { ApiProperty } from '@nestjs/swagger';
import { Weekday } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Minutes in a day — the exclusive upper bound for a slot's end (midnight). */
export const MINUTES_IN_DAY = 24 * 60;
/** Sanity cap on how many windows a tutor can define across the whole week. */
export const MAX_AVAILABILITY_SLOTS = 60;

/**
 * A single recurring weekly window. Times are minutes from local midnight; the
 * service enforces `startMinute < endMinute` and rejects same-weekday overlaps.
 */
export class AvailabilitySlotDto {
  @ApiProperty({ enum: Weekday })
  @IsEnum(Weekday, { message: i18nValidationMessage('validation.common.isEnum') })
  weekday!: Weekday;

  @ApiProperty({ minimum: 0, maximum: MINUTES_IN_DAY - 1, description: 'Minutes from midnight.' })
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.common.min') })
  @Max(MINUTES_IN_DAY - 1, { message: i18nValidationMessage('validation.common.max') })
  startMinute!: number;

  @ApiProperty({ minimum: 1, maximum: MINUTES_IN_DAY, description: 'Minutes from midnight.' })
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(1, { message: i18nValidationMessage('validation.common.min') })
  @Max(MINUTES_IN_DAY, { message: i18nValidationMessage('validation.common.max') })
  endMinute!: number;
}

/**
 * Body of `PUT /api/v1/tutors/me/availability`. Replaces the tutor's whole weekly
 * availability with `slots` — an empty array clears it. A replace (rather than
 * per-slot add/remove) keeps the client's weekly grid the single source of truth.
 */
export class SetAvailabilityDto {
  @ApiProperty({ type: [AvailabilitySlotDto] })
  @IsArray({ message: i18nValidationMessage('validation.common.isArray') })
  @ArrayMaxSize(MAX_AVAILABILITY_SLOTS, {
    message: i18nValidationMessage('validation.common.arrayMaxSize'),
  })
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots!: AvailabilitySlotDto[];
}
