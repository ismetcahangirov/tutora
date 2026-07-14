/**
 * Reviews moderation API (issue #64). Uses the shared Axios client; every
 * response is validated at the boundary with Zod.
 */
import { apiClient, paginatedSchema, type Paginated } from '@shared/lib';

import { ADMIN_REVIEWS_ENDPOINT } from '../constants';
import {
  adminReviewSchema,
  type AdminReview,
  type ListReviewsParams,
  type ModerateReviewBody,
} from '../types';

const reviewsPageSchema = paginatedSchema(adminReviewSchema);

/** List reviews (paginated, filterable by status and tutor). */
export async function listReviews(params: ListReviewsParams): Promise<Paginated<AdminReview>> {
  const { data } = await apiClient.get<unknown>(ADMIN_REVIEWS_ENDPOINT, {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status,
      tutorId: params.tutorId || undefined,
    },
  });
  return reviewsPageSchema.parse(data);
}

/** Set a review's visibility (publish / hide / remove) with an optional reason. */
export async function moderateReview(id: string, body: ModerateReviewBody): Promise<AdminReview> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_REVIEWS_ENDPOINT}/${id}/moderate`, body);
  return adminReviewSchema.parse(data);
}
