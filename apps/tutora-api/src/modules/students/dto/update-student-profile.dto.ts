import { ApiPropertyOptional } from '@nestjs/swagger';
import { EducationLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on the free-text student bio. */
export const STUDENT_BIO_MAX_LENGTH = 1000;

/**
 * Body of `PATCH /api/v1/students/me`. Both fields optional so the same DTO
 * serves the initial fill and later edits. These are the student's preferences
 * the marketplace uses to tailor recommendations (#30).
 */
export class UpdateStudentProfileDto {
  @ApiPropertyOptional({ maxLength: STUDENT_BIO_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(STUDENT_BIO_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  bio?: string;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel, { message: i18nValidationMessage('validation.common.isEnum') })
  educationLevel?: EducationLevel;
}
