import { useQuery } from '@tanstack/react-query';

import { USER_ROLES, type UserRole } from '@shared/rbac';

import { countUsersByRole } from '../api/roles.api';
import { roleKeys } from '../constants';

/** Active member count per role. */
export type RoleCounts = Record<UserRole, number>;

/** Fetches the member count for every role in parallel. */
export function useRoleCountsQuery() {
  return useQuery({
    queryKey: roleKeys.counts,
    queryFn: async (): Promise<RoleCounts> => {
      const entries = await Promise.all(
        USER_ROLES.map(async (role) => [role, await countUsersByRole(role)] as const),
      );
      return Object.fromEntries(entries) as RoleCounts;
    },
  });
}
