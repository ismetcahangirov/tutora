/**
 * useNotifications — the caller's paginated notification feed (#50).
 *
 * Wraps `useInfiniteQuery` so the feed grows page-by-page as the user scrolls.
 * The flattened `notifications` array and `total` are derived for the screen;
 * paging is owned here. The backend returns newest-first, so no client sort is
 * needed. `unreadOnly` scopes the feed and keys the query independently.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listNotifications } from '../api/notifications.api';
import { DEFAULT_PAGE_SIZE, notificationKeys } from '../constants';
import type { AppNotification } from '../types';

export type UseNotificationsResult = {
  notifications: AppNotification[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  refetch: () => void;
  fetchNextPage: () => void;
};

export function useNotifications(unreadOnly = false): UseNotificationsResult {
  const query = useInfiniteQuery({
    queryKey: notificationKeys.feed(unreadOnly),
    queryFn: ({ pageParam }) =>
      listNotifications({ page: pageParam, limit: DEFAULT_PAGE_SIZE, unreadOnly }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined),
  });

  const notifications = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  return {
    notifications,
    total: query.data?.pages[0]?.meta.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    refetch: () => void query.refetch(),
    fetchNextPage: () => void query.fetchNextPage(),
  };
}
