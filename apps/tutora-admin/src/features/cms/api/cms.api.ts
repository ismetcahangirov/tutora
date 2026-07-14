/**
 * CMS API (issue #67). Uses the shared Axios client; every response is validated
 * at the boundary with Zod. Backed by the API's `admin/content` controller.
 */
import { apiClient, paginatedSchema, type Paginated } from '@shared/lib';

import { ADMIN_CONTENT_ENDPOINT } from '../constants';
import {
  contentEntrySchema,
  type ContentEntry,
  type CreateContentBody,
  type ListContentParams,
  type UpdateContentBody,
} from '../types';

const contentPageSchema = paginatedSchema(contentEntrySchema);

/** List content entries (paginated, filterable by type, locale, status, text). */
export async function listContent(params: ListContentParams): Promise<Paginated<ContentEntry>> {
  const { data } = await apiClient.get<unknown>(ADMIN_CONTENT_ENDPOINT, {
    params: {
      page: params.page,
      limit: params.limit,
      type: params.type,
      locale: params.locale || undefined,
      status: params.status,
      q: params.q || undefined,
    },
  });
  return contentPageSchema.parse(data);
}

/** Create a content entry. */
export async function createContent(body: CreateContentBody): Promise<ContentEntry> {
  const { data } = await apiClient.post<unknown>(ADMIN_CONTENT_ENDPOINT, body);
  return contentEntrySchema.parse(data);
}

/** Update a content entry's copy, order, or publish state. */
export async function updateContent(id: string, body: UpdateContentBody): Promise<ContentEntry> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_CONTENT_ENDPOINT}/${id}`, body);
  return contentEntrySchema.parse(data);
}

/** Delete a content entry. */
export async function deleteContent(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_CONTENT_ENDPOINT}/${id}`);
}
