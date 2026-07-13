/**
 * useUnreadNotificationsCount — total unread notifications for the badge (#50).
 *
 * A tiny `{ count }` payload, polled on a slow interval so the badge stays roughly
 * live without a socket. Failures fall back to `0` (no badge) rather than surfacing
 * an error — a missing badge is the correct degraded state.
 */
import { useQuery } from '@tanstack/react-query';

import { getUnreadCount } from '../api/notifications.api';
import { UNREAD_POLL_INTERVAL, notificationKeys } from '../constants';

export type UseUnreadNotificationsCountResult = {
  count: number;
};

export function useUnreadNotificationsCount(): UseUnreadNotificationsCountResult {
  const query = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: UNREAD_POLL_INTERVAL,
  });

  return { count: query.data?.count ?? 0 };
}
