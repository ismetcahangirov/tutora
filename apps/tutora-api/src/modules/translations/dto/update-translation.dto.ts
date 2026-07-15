import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DESCRIPTION_MAX_LENGTH } from './create-translation.dto';
import { TranslationValuesDto } from './translation-values.dto';

/**
 * Body of `PATCH /admin/translations/:id`. `namespace` and `key` are immutable
 * (they define the entry's identity), so only `description` and `values` can
 * change. `values` replaces the stored map wholesale — send every locale that
 * should persist.
 */
export class UpdateTranslationDto {
  @ApiPropertyOptional({ maxLength: DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(DESCRIPTION_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  description?: string;

  @ApiPropertyOptional({ type: TranslationValuesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationValuesDto)
  values?: TranslationValuesDto;
}
