/**
 * Reviews feature — types (student epic #40, #44; backend #33).
 *
 * Read-only view of a tutor's published reviews for the profile screen. The
 * write flow (submitting/editing a review) is a separate story (#48) and will
 * extend this feature; nothing here mutates.
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
