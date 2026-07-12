import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on a cuid-ish id, matching the other DTOs in this codebase. */
const ID_MAX_LENGTH = 60;

/**
 * Body of `POST /api/v1/chat/threads`. Role-aware: a STUDENT supplies the
 * `tutorId` (TutorProfile id), a TUTOR supplies the `studentId` (StudentProfile
 * id). The service derives the caller's own side and enforces the rule.
 */
export class StartThreadDto {
  @ApiPropertyOptional({ description: 'TutorProfile id — required when the caller is a student.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(ID_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  tutorId?: string;

  @ApiPropertyOptional({ description: 'StudentProfile id — required when the caller is a tutor.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(ID_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  studentId?: string;
}
