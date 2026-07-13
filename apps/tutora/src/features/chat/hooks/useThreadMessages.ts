/**
 * useThreadMessages — a thread's paginated message history (#47).
 *
 * Messages come back newest-first, which is exactly the order an inverted
 * `FlatList` renders (index 0 at the bottom), so no reversal is needed. Older
 * pages are appended via `fetchNextPage` as the user scrolls up. While the
 * thread is open the query polls on a modest interval so the counterpart's new
 * messages arrive without a manual refresh (a lightweight stand-in for the #34
 * realtime gateway until a socket client is wired).
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listMessages } from '../api/chat.api';
import { DEFAULT_PAGE_SIZE, MESSAGES_POLL_INTERVAL, chatKeys } from '../constants';
import type { ChatMessage } from '../types';

export type UseThreadMessagesResult = {
  messages: ChatMessage[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  refetch: () => void;
  fetchNextPage: () => void;
};

export function useThreadMessages(threadId: string): UseThreadMessagesResult {
  const query = useInfiniteQuery({
    queryKey: chatKeys.messages(threadId),
    queryFn: ({ pageParam }) =>
      listMessages(threadId, { page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined),
    enabled: threadId.length > 0,
    refetchInterval: MESSAGES_POLL_INTERVAL,
  });

  const messages = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    refetch: () => void query.refetch(),
    fetchNextPage: () => void query.fetchNextPage(),
  };
}
