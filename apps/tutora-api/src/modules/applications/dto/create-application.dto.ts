import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonFormat } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on the free-text application message. */
export const APPLICATION_MESSAGE_MAX_LENGTH = 1000;

/**
 * Body of `POST /api/v1/applications`. The student is resolved from the token;
 * only the target tutor, an optional subject/format, and a short message are
 * supplied by the client.
 */
export class CreateApplicationDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  tutorId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(60, { message: i18nValidationMessage('validation.common.maxLength') })
  subjectId?: string;

  @ApiPropertyOptional({ enum: LessonFormat })
  @IsOptional()
  @IsEnum(LessonFormat, { message: i18nValidationMessage('validation.common.isEnum') })
  format?: LessonFormat;

  @ApiPropertyOptional({ maxLength: APPLICATION_MESSAGE_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(APPLICATION_MESSAGE_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  message?: string;
}
