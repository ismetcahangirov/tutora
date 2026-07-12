import { ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UpdateTutorProfileDto } from './update-tutor-profile.dto';

/**
 * Body of `PATCH /api/v1/admin/tutors/:id`. Extends the tutor-editable fields
 * with `verificationStatus`, which only an admin may set directly.
 */
export class AdminUpdateTutorDto extends UpdateTutorProfileDto {
  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  verificationStatus?: VerificationStatus;
}
