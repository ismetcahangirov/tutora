/**
 * useUnreadCount — total unread messages for the Messages tab badge (#47).
 *
 * A tiny `{ count }` payload, polled on a slow interval so the badge stays
 * roughly live without a socket. Failures fall back to `0` (no badge) rather
 * than surfacing an error — a missing badge is the correct degraded state.
 */
import { useQuery } from '@tanstack/react-query';

import { getUnreadCount } from '../api/chat.api';
import { UNREAD_POLL_INTERVAL, chatKeys } from '../constants';

export type UseUnreadCountResult = {
  count: number;
};

export function useUnreadCount(): UseUnreadCountResult {
  const query = useQuery({
    queryKey: chatKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: UNREAD_POLL_INTERVAL,
  });

  return { count: query.data?.count ?? 0 };
}
