/**
 * The standard paginated response envelope (student epic #40).
 *
 * Every list endpoint on the backend returns `{ data, meta }` with this metadata,
 * so the shape is shared across features (tutor search, reviews) rather than
 * redefined per feature.
 */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};
