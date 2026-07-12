import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Body of `POST /api/v1/tutors/me/certificates`. Accepts an already-uploaded
 * `fileUrl` — the tutor first gets a signed URL from the media module
 * (`POST /api/v1/media/uploads`, #37), uploads the file, then submits it here.
 * New certificates enter as PENDING and require admin review before they count.
 */
export class CreateCertificateDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(200, { message: i18nValidationMessage('validation.common.maxLength') })
  title!: string;

  @ApiProperty()
  @IsUrl({ require_tld: false }, { message: i18nValidationMessage('validation.common.isUrl') })
  fileUrl!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(200, { message: i18nValidationMessage('validation.common.maxLength') })
  issuedBy?: string;
}
