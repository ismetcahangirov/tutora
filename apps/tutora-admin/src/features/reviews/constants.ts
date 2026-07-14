import { API_PREFIX } from '@shared/lib';

import type { ListReviewsParams } from './types';

/** Admin review-moderation endpoint base (relative to `VITE_API_URL`). */
export const ADMIN_REVIEWS_ENDPOINT = `${API_PREFIX}/admin/reviews`;

/** Page size for the reviews table. */
export const REVIEWS_PAGE_SIZE = 20;

/**
 * Query keys. Invalidating `all` also invalidates every `list(params)`, so a
 * moderation mutation refreshes the current page in one call.
 */
export const reviewsKeys = {
  all: ['admin', 'reviews'] as const,
  list: (params: ListReviewsParams) => ['admin', 'reviews', 'list', params] as const,
};
