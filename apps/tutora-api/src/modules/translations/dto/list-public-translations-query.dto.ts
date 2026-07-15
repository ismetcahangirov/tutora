import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { SUPPORTED_LANGUAGES } from '@/i18n/i18n.config';

/**
 * Query parameters for the public translations endpoint (#85). An optional
 * `locale` narrows the response to a single language's flat key map; omitting it
 * returns every supported locale's map.
 */
export class ListPublicTranslationsQueryDto {
  @ApiPropertyOptional({ enum: SUPPORTED_LANGUAGES })
  @IsOptional()
  @IsIn(SUPPORTED_LANGUAGES, { message: i18nValidationMessage('validation.common.isEnum') })
  locale?: (typeof SUPPORTED_LANGUAGES)[number];
}
