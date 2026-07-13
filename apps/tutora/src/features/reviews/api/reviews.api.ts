/**
 * reviews API (student epic #40, #44, #48; backend #33).
 *
 * Read: list a tutor's published reviews (public, paginated envelope).
 * Write: a student authors, lists, edits and deletes their own reviews. Every
 * write goes through the shared client so auth + refresh are handled in one place.
 */
import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';

import { MY_REVIEWS_PAGE_SIZE, REVIEW_ENDPOINTS } from '../constants';
import type { MyReview, Review, SubmitReviewInput, UpdateReviewInput } from '../types';

/** GET one page of a tutor's published reviews, newest first. */
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

/** GET one page of the caller's own reviews, newest first. */
export async function getMyReviews(
  page = 1,
  limit = MY_REVIEWS_PAGE_SIZE,
): Promise<Paginated<MyReview>> {
  const { data } = await apiClient.get<Paginated<MyReview>>(REVIEW_ENDPOINTS.mine, {
    params: { page, limit },
  });
  return data;
}

/** POST a review for a completed application and return the created review. */
export async function submitReview(input: SubmitReviewInput): Promise<MyReview> {
  const { data } = await apiClient.post<MyReview>(REVIEW_ENDPOINTS.root, input);
  return data;
}

/** PATCH one of the caller's own reviews and return the updated review. */
export async function updateReview(id: string, input: UpdateReviewInput): Promise<MyReview> {
  const { data } = await apiClient.patch<MyReview>(REVIEW_ENDPOINTS.byId(id), input);
  return data;
}

/** DELETE one of the caller's own reviews. */
export async function deleteReview(id: string): Promise<void> {
  await apiClient.delete(REVIEW_ENDPOINTS.byId(id));
}
