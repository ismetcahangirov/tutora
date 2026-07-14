import { API_PREFIX } from '@shared/lib';

import type { ListTutorsParams } from './types';

/** Admin tutor-management endpoint base (relative to `VITE_API_URL`). */
export const ADMIN_TUTORS_ENDPOINT = `${API_PREFIX}/admin/tutors`;

/** Page size for the verification queue. */
export const VERIFICATIONS_PAGE_SIZE = 20;

/**
 * Query keys. The `all` prefix is `['admin', 'tutors']`, so invalidating it also
 * invalidates every `detail(id)` — one call refreshes the queue and open detail.
 */
export const verificationsKeys = {
  all: ['admin', 'tutors'] as const,
  list: (params: ListTutorsParams) => ['admin', 'tutors', 'list', params] as const,
  detail: (id: string) => ['admin', 'tutors', 'detail', id] as const,
};
