/**
 * Reviews feature — endpoints, keys, defaults (student epic #40, #44, #48).
 *
 * User-facing copy lives in the i18n catalogs under `reviews.*`; this file holds
 * only stable, non-localized constants. Rating/comment bounds mirror the backend
 * `CreateReviewDto` so the client validates before a doomed request.
 */

/** Authenticated review endpoints, appended to `EXPO_PUBLIC_API_URL`. */
export const REVIEW_ENDPOINTS = {
  /** Public reviews-for-a-tutor endpoint. Append the tutor id. */
  forTutor: (tutorId: string) => `/api/v1/tutors/${tutorId}/reviews`,
  /** Author a review / the caller's own reviews live under `/reviews`. */
  root: '/api/v1/reviews',
  mine: '/api/v1/reviews/me',
  /** One of the caller's own reviews: `/reviews/:id`. */
  byId: (id: string) => `/api/v1/reviews/${id}`,
} as const;

/** How many reviews the profile screen previews before "see all". */
export const REVIEW_PREVIEW_LIMIT = 5;

/** Default page size for the caller's own reviews list. Matches the backend default. */
export const MY_REVIEWS_PAGE_SIZE = 20;

/** Rating scale bounds (inclusive). Mirrors the backend `CreateReviewDto`. */
export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** Upper bound on the free-text review comment. Mirrors the backend. */
export const REVIEW_COMMENT_MAX_LENGTH = 2000;

/** Structured, stable query keys keyed by tutor + page size. */
export const reviewKeys = {
  all: ['reviews'] as const,
  forTutor: (tutorId: string, limit: number) =>
    [...reviewKeys.all, 'tutor', tutorId, { limit }] as const,
  mine: (limit: number) => [...reviewKeys.all, 'mine', { limit }] as const,
};
