import { API_PREFIX } from '@shared/lib';

import type { ListUsersParams } from './types';

/** Admin user-management endpoint base (relative to `VITE_API_URL`). */
export const ADMIN_USERS_ENDPOINT = `${API_PREFIX}/admin/users`;

/** Page size for the users table. */
export const USERS_PAGE_SIZE = 20;

/** Structured, stable query keys so mutations can invalidate precisely. */
export const usersKeys = {
  all: ['admin', 'users'] as const,
  list: (params: ListUsersParams) => ['admin', 'users', 'list', params] as const,
  detail: (id: string) => ['admin', 'users', 'detail', id] as const,
};
