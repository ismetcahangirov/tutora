import { API_PREFIX } from '@shared/lib';

/**
 * The roles panel reuses the admin users listing to count members per role; it
 * reads only the pagination `meta.total`, so it never over-fetches rows.
 */
export const ADMIN_USERS_ENDPOINT = `${API_PREFIX}/admin/users`;

/** Query key for the per-role member counts. */
export const roleKeys = {
  counts: ['admin', 'role-counts'] as const,
};
