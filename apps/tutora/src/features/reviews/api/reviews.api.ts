/**
 * reviews API — list a tutor's published reviews (student epic #40, #44).
 *
 * Public endpoint returning the standard paginated envelope; the backend already
 * filters to PUBLISHED reviews, newest first. Goes through the shared client for
 * one HTTP layer.
 */
import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';

import { REVIEW_ENDPOINTS } from '../constants';
import type { Review } from '../types';

/** GET one page of a tutor's reviews. */
export async function getTutorReviews(
  tutorId: string,
  page = 1,
  limit = 20,
): Promise<Paginated<Review>> {
  const { data } = await apiClient.get<Paginated<Review>>(REVIEW_ENDPOINTS.forTutor(tutorId), {
    params: { page, limit },
  });
  return data;
}
