/**
 * useUnreadNotificationsCount — total unread notifications for the badge (#50).
 *
 * A tiny `{ count }` payload, polled on a slow interval so the badge stays roughly
 * live without a socket. Failures fall back to `0` (no badge) rather than surfacing
 * an error — a missing badge is the correct degraded state.
 */
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@features/auth';

import { getUnreadCount } from '../api/notifications.api';
import { UNREAD_POLL_INTERVAL, notificationKeys } from '../constants';

export type UseUnreadNotificationsCountResult = {
  count: number;
};

export function useUnreadNotificationsCount(): UseUnreadNotificationsCountResult {
  const { isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: UNREAD_POLL_INTERVAL,
    // Only poll once a session exists. Without this the badge races ahead of
    // token restoration on cold start and 401s with no token to refresh.
    enabled: isAuthenticated,
  });

  return { count: query.data?.count ?? 0 };
}
