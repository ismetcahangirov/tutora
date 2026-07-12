import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** First page index used when the client omits `page`. */
export const DEFAULT_PAGE = 1;
/** Page size used when the client omits `limit`. */
export const DEFAULT_PAGE_SIZE = 20;
/** Upper bound on `limit` so a single request can never fetch an unbounded set. */
export const MAX_PAGE_SIZE = 100;

/**
 * Reusable query parameters for every paginated list endpoint. Feature list DTOs
 * extend this so pagination stays consistent across the API (see API Rules).
 * `page`/`limit` are coerced from their string query representation and bounded.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(1, { message: i18nValidationMessage('validation.common.min') })
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.common.isInt') })
  @Min(1, { message: i18nValidationMessage('validation.common.min') })
  @Max(MAX_PAGE_SIZE, { message: i18nValidationMessage('validation.common.max') })
  limit: number = DEFAULT_PAGE_SIZE;

  /** Prisma `skip` derived from the current page and page size. */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
