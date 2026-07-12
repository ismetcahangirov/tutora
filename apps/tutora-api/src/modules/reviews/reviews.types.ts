import type { ReviewStatus } from '@prisma/client';

/** Public identity of a review's author. */
export interface ReviewAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Review projection for the student's own list and public tutor listings.
 * `status` is included so the author can see whether a review was moderated.
 */
export interface ReviewView {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  author: ReviewAuthor;
  createdAt: Date;
  updatedAt: Date;
}

/** Admin projection: the base view plus moderation metadata and the tutor. */
export interface AdminReviewView extends ReviewView {
  tutorId: string;
  tutorName: string | null;
  hiddenReason: string | null;
  moderatedById: string | null;
  moderatedAt: Date | null;
}
