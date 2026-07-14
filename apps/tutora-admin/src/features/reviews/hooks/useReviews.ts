import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listReviews } from '../api/reviews.api';
import { reviewsKeys } from '../constants';
import type { ListReviewsParams } from '../types';

/** Reviews list query. Keeps the current page while the next one loads. */
export function useReviewsQuery(params: ListReviewsParams) {
  return useQuery({
    queryKey: reviewsKeys.list(params),
    queryFn: () => listReviews(params),
    placeholderData: keepPreviousData,
  });
}
