/**
 * Reviews feature — endpoints, keys, defaults (student epic #40, #44).
 */

/** Public reviews-for-a-tutor endpoint. Append the tutor id. */
export const REVIEW_ENDPOINTS = {
  forTutor: (tutorId: string) => `/api/v1/tutors/${tutorId}/reviews`,
} as const;

/** How many reviews the profile screen previews before "see all". */
export const REVIEW_PREVIEW_LIMIT = 5;

/** Structured, stable query keys keyed by tutor + page size. */
export const reviewKeys = {
  all: ['reviews'] as const,
  forTutor: (tutorId: string, limit: number) =>
    [...reviewKeys.all, 'tutor', tutorId, { limit }] as const,
};
