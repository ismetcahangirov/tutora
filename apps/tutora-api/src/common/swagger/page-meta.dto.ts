import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination metadata returned alongside every paginated list. Mirrors the
 * `PageMeta` shape from `common/pagination/page.ts` and is referenced by the
 * {@link ApiPaginatedResponse} decorator.
 */
export class PageMetaDto {
  @ApiProperty({ example: 1, description: 'Current 1-based page index.' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Number of items per page.' })
  limit!: number;

  @ApiProperty({ example: 137, description: 'Total number of matching records.' })
  total!: number;

  @ApiProperty({ example: 7, description: 'Total number of pages (always at least 1).' })
  totalPages!: number;

  @ApiProperty({ example: true, description: 'Whether a next page exists.' })
  hasNext!: boolean;

  @ApiProperty({ example: false, description: 'Whether a previous page exists.' })
  hasPrev!: boolean;
}
