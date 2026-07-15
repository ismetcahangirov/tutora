import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { NAMESPACE_MAX_LENGTH } from './create-translation.dto';

/** Upper bound on the free-text query so a single filter can't be unbounded. */
const QUERY_MAX_LENGTH = 160;

/**
 * Query parameters for the admin translation listing (#85). Extends pagination
 * and adds a namespace filter plus a free-text match over the key.
 */
export class ListTranslationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'search' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(NAMESPACE_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  namespace?: string;

  @ApiPropertyOptional({ description: 'Case-insensitive match on the key.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(QUERY_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  q?: string;
}
