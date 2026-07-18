/**
 * useThreads — the caller's paginated conversation list (#47).
 *
 * Wraps `useInfiniteQuery` so the thread list grows page-by-page as the user
 * scrolls. The flattened `threads` array and `total` are derived for the screen;
 * paging is owned here. Threads come back most-recently-active first from the
 * backend, so no client-side sorting is needed.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@features/auth';

import { listThreads } from '../api/chat.api';
import { DEFAULT_PAGE_SIZE, chatKeys } from '../constants';
import type { ChatThread } from '../types';

export type UseThreadsResult = {
  threads: ChatThread[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  refetch: () => void;
  fetchNextPage: () => void;
};

export function useThreads(): UseThreadsResult {
  const { isAuthenticated } = useAuth();
  const query = useInfiniteQuery({
    queryKey: chatKeys.threads(),
    queryFn: ({ pageParam }) => listThreads({ page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined),
    // Don't query until the session is restored, so a cold-start auth race can't
    // put the Messages list into an error state with no token to refresh.
    enabled: isAuthenticated,
  });

  const threads = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);

  return {
    threads,
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
