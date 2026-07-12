/** Pagination metadata returned alongside every paginated list. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Standard envelope for a page of results (see API Rules → pagination). */
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

/**
 * Assembles a {@link Paginated} envelope from a page of rows and the total count.
 * `totalPages` is at least 1 so an empty result still reports a coherent shape.
 */
export function buildPage<T>(data: T[], total: number, page: number, limit: number): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
