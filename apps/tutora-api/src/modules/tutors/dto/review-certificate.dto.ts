import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** The two decisions an admin can record when reviewing a certificate. */
export const CERTIFICATE_DECISIONS: readonly CertificateStatus[] = [
  CertificateStatus.VERIFIED,
  CertificateStatus.REJECTED,
];

/** Upper bound on the admin's certificate review reason. */
export const CERTIFICATE_REASON_MAX_LENGTH = 500;

/** Body of `PATCH /api/v1/admin/tutors/:id/certificates/:certificateId`. */
export class ReviewCertificateDto {
  @ApiProperty({ enum: CERTIFICATE_DECISIONS })
  @IsIn(CERTIFICATE_DECISIONS as CertificateStatus[], {
    message: i18nValidationMessage('validation.common.isEnum'),
  })
  status!: CertificateStatus;

  /**
   * Why the certificate was rejected. Shown to the tutor so they can re-upload
   * a corrected file; cleared automatically when the decision is VERIFIED.
   */
  @ApiPropertyOptional({ maxLength: CERTIFICATE_REASON_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(CERTIFICATE_REASON_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  reason?: string;
}
