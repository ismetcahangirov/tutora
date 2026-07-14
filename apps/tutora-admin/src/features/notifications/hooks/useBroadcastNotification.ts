import { useMutation } from '@tanstack/react-query';

import { broadcastNotification } from '../api/notifications.api';
import type { BroadcastNotificationBody } from '../types';

/**
 * Fire a broadcast. There is no cached list to invalidate — delivery is
 * one-shot — so the caller surfaces the outcome (recipient count) from the
 * mutation result directly.
 */
export function useBroadcastNotification() {
  return useMutation({
    mutationFn: (body: BroadcastNotificationBody) => broadcastNotification(body),
  });
}
