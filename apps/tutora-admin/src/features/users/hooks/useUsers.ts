import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listUsers } from '../api/users.api';
import { usersKeys } from '../constants';
import type { ListUsersParams } from '../types';

/**
 * Users list query. `keepPreviousData` holds the current page on screen while
 * the next page or a changed filter loads, so paging never flashes empty.
 */
export function useUsersQuery(params: ListUsersParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });
}
