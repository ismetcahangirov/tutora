import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on the admin's verification decision reason. */
export const VERIFICATION_REASON_MAX_LENGTH = 500;

/** Body of `PATCH /api/v1/admin/tutors/:id/verification`. */
export class SetVerificationDto {
  @ApiProperty({ enum: VerificationStatus })
  @IsEnum(VerificationStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status!: VerificationStatus;

  /**
   * Why the tutor was rejected. Shown to the tutor so they can fix and
   * re-apply; cleared automatically when the decision is VERIFIED.
   */
  @ApiPropertyOptional({ maxLength: VERIFICATION_REASON_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(VERIFICATION_REASON_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  reason?: string;
}
