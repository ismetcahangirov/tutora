/**
 * useMarkAllNotificationsRead — clear every unread notification at once (#50).
 *
 * Backs the "mark all read" action in the feed header. Only a non-zero read count
 * invalidates the notification queries, so tapping it on an already-clear feed
 * costs no refetch. Exposes async `markAll` + `isPending` for the header button.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { markAllNotificationsRead } from '../api/notifications.api';
import { notificationKeys } from '../constants';

export type UseMarkAllNotificationsReadResult = {
  markAll: () => Promise<void>;
  isPending: boolean;
};

export function useMarkAllNotificationsRead(): UseMarkAllNotificationsReadResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: ({ readCount }) => {
      if (readCount > 0) {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      }
    },
  });

  const markAll = useCallback(async () => {
    await mutation.mutateAsync();
  }, [mutation]);

  return { markAll, isPending: mutation.isPending };
}
