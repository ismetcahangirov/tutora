/**
 * useMarkNotificationRead — mark a single notification read (#50).
 *
 * Triggered when the user opens/taps a notification. On success it invalidates
 * every notification query so the feed and the unread badge both refresh. `mutate`
 * is memoized so callers can fire it from an effect without re-running each render.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { markNotificationRead } from '../api/notifications.api';
import { notificationKeys } from '../constants';

export type UseMarkNotificationReadResult = {
  markRead: (id: string) => void;
};

export function useMarkNotificationRead(): UseMarkNotificationReadResult {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const markRead = useCallback((id: string) => mutate(id), [mutate]);

  return { markRead };
}
