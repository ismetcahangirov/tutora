import { API_PREFIX } from '@shared/lib';

import type { ListContentParams } from './types';

/** Admin CMS endpoint base (relative to `VITE_API_URL`). */
export const ADMIN_CONTENT_ENDPOINT = `${API_PREFIX}/admin/content`;

/** Page size for the content table. */
export const CONTENT_PAGE_SIZE = 20;

/** Structured, stable query keys so mutations can invalidate precisely. */
export const contentKeys = {
  all: ['admin', 'content'] as const,
  list: (params: ListContentParams) => ['admin', 'content', 'list', params] as const,
};
