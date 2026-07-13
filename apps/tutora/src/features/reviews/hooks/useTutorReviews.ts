/**
 * useTutorReviews — a page of a tutor's reviews for the profile (epic #40, #44).
 *
 * The detail screen previews the first page; the full paginated list belongs to
 * the review-management story (#48). Disabled until a tutor id is present.
 */
import { useQuery } from '@tanstack/react-query';

import { getTutorReviews } from '../api/reviews.api';
import { REVIEW_PREVIEW_LIMIT, reviewKeys } from '../constants';
import type { Review } from '../types';

export type UseTutorReviewsResult = {
  reviews: Review[];
  total: number;
  isLoading: boolean;
  isError: boolean;
};

export function useTutorReviews(
  tutorId: string,
  limit: number = REVIEW_PREVIEW_LIMIT,
): UseTutorReviewsResult {
  const query = useQuery({
    queryKey: reviewKeys.forTutor(tutorId, limit),
    queryFn: () => getTutorReviews(tutorId, 1, limit),
    enabled: tutorId.length > 0,
  });

  return {
    reviews: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
