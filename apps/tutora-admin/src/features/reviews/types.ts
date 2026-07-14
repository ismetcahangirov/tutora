/**
 * Reviews moderation contracts (issue #64). Mirrors the API's `AdminReviewView`
 * and the moderation DTO. Zod validates every backend payload at the boundary;
 * the TypeScript types are inferred from the schemas. There is no separate
 * "report" entity on the backend — abuse/spam is resolved by moderating the
 * offending review's visibility, so this feature is that moderation surface.
 */
import { z } from 'zod';

/** Review visibility state (mirrors Prisma `ReviewStatus`). */
export const REVIEW_STATUSES = ['PUBLISHED', 'HIDDEN', 'REMOVED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** The lowest and highest star rating a review can carry. */
export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** Upper bound on the moderator's reason note (mirrors the API's DTO). */
export const HIDDEN_REASON_MAX_LENGTH = 500;

/** Public identity of a review's author. */
export const reviewAuthorSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

/** Admin review projection. Dates arrive as ISO strings over JSON. */
export const adminReviewSchema = z.object({
  id: z.string(),
  rating: z.number(),
  comment: z.string().nullable(),
  status: z.enum(REVIEW_STATUSES),
  author: reviewAuthorSchema,
  tutorId: z.string(),
  tutorName: z.string().nullable(),
  hiddenReason: z.string().nullable(),
  moderatedById: z.string().nullable(),
  moderatedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminReview = z.infer<typeof adminReviewSchema>;

/** Query parameters for the admin reviews list. */
export type ListReviewsParams = {
  page: number;
  limit: number;
  status?: ReviewStatus;
  tutorId?: string;
};

/** Body for the moderation decision. `hiddenReason` is cleared on re-publish. */
export type ModerateReviewBody = {
  status: ReviewStatus;
  hiddenReason?: string;
};
