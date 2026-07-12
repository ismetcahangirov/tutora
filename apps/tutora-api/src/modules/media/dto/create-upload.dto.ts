import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MediaPurpose } from '../media.types';

/** Generous upper bound on a MIME type string; the real allowlist is per purpose. */
export const CONTENT_TYPE_MAX_LENGTH = 100;

/**
 * Body of `POST /api/v1/media/uploads`. Declares what the client intends to
 * upload; the server decides where it lands, how large it may be, and whether the
 * content type is permitted for that purpose (see `UPLOAD_SPECS`).
 */
export class CreateUploadDto {
  @ApiProperty({ enum: MediaPurpose, description: 'What the file is for.' })
  @IsEnum(MediaPurpose, { message: i18nValidationMessage('validation.common.isEnum') })
  purpose!: MediaPurpose;

  @ApiProperty({
    example: 'image/jpeg',
    maxLength: CONTENT_TYPE_MAX_LENGTH,
    description: 'MIME type of the file to upload (must be allowed for the purpose).',
  })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.common.notEmpty') })
  @MaxLength(CONTENT_TYPE_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  contentType!: string;
}
