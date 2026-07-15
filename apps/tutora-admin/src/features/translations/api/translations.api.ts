/**
 * Translations API (issue #85). Uses the shared Axios client; every response is
 * validated at the boundary with Zod. Backed by the API's `admin/translations`
 * controller.
 */
import { apiClient, paginatedSchema, type Paginated } from '@shared/lib';

import { ADMIN_TRANSLATIONS_ENDPOINT } from '../constants';
import {
  translationSchema,
  type CreateTranslationBody,
  type ListTranslationsParams,
  type Translation,
  type UpdateTranslationBody,
} from '../types';

const translationPageSchema = paginatedSchema(translationSchema);

/** List translation keys (paginated, filterable by namespace and free text). */
export async function listTranslations(
  params: ListTranslationsParams,
): Promise<Paginated<Translation>> {
  const { data } = await apiClient.get<unknown>(ADMIN_TRANSLATIONS_ENDPOINT, {
    params: {
      page: params.page,
      limit: params.limit,
      namespace: params.namespace || undefined,
      q: params.q || undefined,
    },
  });
  return translationPageSchema.parse(data);
}

/** Create a translation key. */
export async function createTranslation(body: CreateTranslationBody): Promise<Translation> {
  const { data } = await apiClient.post<unknown>(ADMIN_TRANSLATIONS_ENDPOINT, body);
  return translationSchema.parse(data);
}

/** Update a translation key's description or per-locale values. */
export async function updateTranslation(
  id: string,
  body: UpdateTranslationBody,
): Promise<Translation> {
  const { data } = await apiClient.patch<unknown>(`${ADMIN_TRANSLATIONS_ENDPOINT}/${id}`, body);
  return translationSchema.parse(data);
}

/** Delete a translation key. */
export async function deleteTranslation(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_TRANSLATIONS_ENDPOINT}/${id}`);
}
