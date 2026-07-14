/**
 * Roles API (issue #69). The RBAC model itself is client-side (`@shared/rbac`);
 * the only server data the panel needs is how many active members each role has,
 * read from the admin users listing's pagination metadata.
 */
import { z } from 'zod';

import { apiClient, pageMetaSchema } from '@shared/lib';
import type { UserRole } from '@shared/rbac';

import { ADMIN_USERS_ENDPOINT } from '../constants';

/** Only the page envelope's `meta` is needed to read a count. */
const countSchema = z.object({ meta: pageMetaSchema });

/** Count active users holding a role (reads `meta.total`; fetches no rows). */
export async function countUsersByRole(role: UserRole): Promise<number> {
  const { data } = await apiClient.get<unknown>(ADMIN_USERS_ENDPOINT, {
    params: { role, page: 1, limit: 1 },
  });
  return countSchema.parse(data).meta.total;
}
