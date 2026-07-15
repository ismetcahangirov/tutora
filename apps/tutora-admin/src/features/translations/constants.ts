import { API_PREFIX } from '@shared/lib';

import type { ListTranslationsParams } from './types';

/** Admin translations endpoint base (relative to `VITE_API_URL`). */
export const ADMIN_TRANSLATIONS_ENDPOINT = `${API_PREFIX}/admin/translations`;

/** Page size for the translations table. */
export const TRANSLATIONS_PAGE_SIZE = 20;

/** Structured, stable query keys so mutations can invalidate precisely. */
export const translationKeys = {
  all: ['admin', 'translations'] as const,
  list: (params: ListTranslationsParams) => ['admin', 'translations', 'list', params] as const,
};
