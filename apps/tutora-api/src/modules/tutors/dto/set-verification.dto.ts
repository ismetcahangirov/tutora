import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Body of `PATCH /api/v1/admin/tutors/:id/verification`. */
export class SetVerificationDto {
  @ApiProperty({ enum: VerificationStatus })
  @IsEnum(VerificationStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status!: VerificationStatus;
}
