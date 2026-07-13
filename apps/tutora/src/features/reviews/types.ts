/**
 * Reviews feature — types (student epic #40, #44, #48; backend #33).
 *
 * Two sides live here:
 *  - Read: a tutor's published reviews on the profile screen (`Review`).
 *  - Write (#48): a student authors, edits and deletes their own reviews and
 *    reviews their own list (`MyReview`, which carries a moderation `status`).
 */
export type ReviewAuthor = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  author: ReviewAuthor;
  createdAt: string;
  updatedAt: string;
};

/** Moderation state of a review — mirrors the backend `ReviewStatus` enum (#33). */
export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'REMOVED';

/**
 * A review as returned by `GET /reviews/me` — the caller's own review, so it also
 * exposes the moderation `status` the author is allowed to see.
 */
export type MyReview = Review & {
  status: ReviewStatus;
};

/** Body of `POST /reviews`. Tutor + student are derived server-side from the application. */
export type SubmitReviewInput = {
  applicationId: string;
  rating: number;
  comment?: string;
};

/** Body of `PATCH /reviews/:id`. Either field may change; both are optional. */
export type UpdateReviewInput = {
  rating?: number;
  comment?: string;
};
