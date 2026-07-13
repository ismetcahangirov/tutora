/**
 * useNotificationObserver — react to notifications while the app is running (#50).
 *
 * Subscribes to two OS events (a legitimate external-subscription effect, cleaned
 * up on unmount):
 *  - received while foregrounded → invalidate the feed + badge so the in-app UI
 *    reflects the new notification without waiting for the next poll.
 *  - tapped (foreground or background) → resolve the payload to a route and hand
 *    it to `onOpen` for navigation.
 *
 * `onOpen` is held in a ref so re-created callbacks don't tear down and re-add the
 * native listeners on every render.
 */
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { notificationKeys } from '../constants';
import { resolveNotificationRoute, type NotificationRoute } from '../deep-link';
import type { NotificationData } from '../types';

export type UseNotificationObserverOptions = {
  enabled: boolean;
  onOpen: (route: NotificationRoute) => void;
};

export function useNotificationObserver({ enabled, onOpen }: UseNotificationObserverOptions): void {
  const queryClient = useQueryClient();
  const onOpenRef = useRef(onOpen);

  // Keep the ref pointed at the latest callback without re-subscribing the native
  // listeners on every render.
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData | null;
      onOpenRef.current(resolveNotificationRoute(data ?? null));
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [enabled, queryClient]);
}
