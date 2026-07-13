/**
 * useMyReviews — the caller's own reviews for the "My reviews" screen (#48).
 *
 * The first page is plenty for a personal list; each entry carries its moderation
 * `status` so the author sees whether a review is published or hidden.
 */
import { useQuery } from '@tanstack/react-query';

import { getMyReviews } from '../api/reviews.api';
import { MY_REVIEWS_PAGE_SIZE, reviewKeys } from '../constants';
import type { MyReview } from '../types';

export type UseMyReviewsResult = {
  reviews: MyReview[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function useMyReviews(limit: number = MY_REVIEWS_PAGE_SIZE): UseMyReviewsResult {
  const query = useQuery({
    queryKey: reviewKeys.mine(limit),
    queryFn: () => getMyReviews(1, limit),
  });

  return {
    reviews: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
