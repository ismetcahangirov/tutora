/**
 * useMarkThreadRead — clear a thread's unread badge when the user views it (#47).
 *
 * Marking read is a write triggered by *viewing* a thread, so the screen fires
 * it as a one-shot effect. `markRead` is memoized so that effect doesn't re-run
 * every render. Only a non-zero read count invalidates the thread list and the
 * tab badge, so an already-read thread costs no extra refetches.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { markThreadRead } from '../api/chat.api';
import { chatKeys } from '../constants';

export type UseMarkThreadReadResult = {
  markRead: () => void;
};

export function useMarkThreadRead(threadId: string): UseMarkThreadReadResult {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: () => markThreadRead(threadId),
    onSuccess: ({ readCount }) => {
      if (readCount > 0) {
        void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
        void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
      }
    },
  });

  const markRead = useCallback(() => mutate(), [mutate]);

  return { markRead };
}
