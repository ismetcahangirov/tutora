import { ApiProperty } from '@nestjs/swagger';
import { CertificateStatus } from '@prisma/client';
import { IsIn } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** The two decisions an admin can record when reviewing a certificate. */
export const CERTIFICATE_DECISIONS: readonly CertificateStatus[] = [
  CertificateStatus.VERIFIED,
  CertificateStatus.REJECTED,
];

/** Body of `PATCH /api/v1/admin/tutors/:id/certificates/:certificateId`. */
export class ReviewCertificateDto {
  @ApiProperty({ enum: CERTIFICATE_DECISIONS })
  @IsIn(CERTIFICATE_DECISIONS as CertificateStatus[], {
    message: i18nValidationMessage('validation.common.isEnum'),
  })
  status!: CertificateStatus;
}
