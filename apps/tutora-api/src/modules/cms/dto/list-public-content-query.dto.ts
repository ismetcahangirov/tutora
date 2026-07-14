import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const LOCALE_MAX_LENGTH = 10;

/**
 * Query parameters for the public content listing (#67). The public endpoint
 * only ever returns `PUBLISHED` entries, so status is not a client-facing
 * filter — callers just narrow by type and locale.
 */
export class ListPublicContentQueryDto {
  @ApiPropertyOptional({ enum: ContentType })
  @IsOptional()
  @IsEnum(ContentType, { message: i18nValidationMessage('validation.common.isEnum') })
  type?: ContentType;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(LOCALE_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  locale?: string;
}
