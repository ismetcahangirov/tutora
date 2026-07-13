/**
 * NotificationsBridge — wires push notifications to the app shell (#50).
 *
 * A render-less bridge mounted once inside the root providers (auth + query +
 * navigation). It gates on `isAuthenticated`, so device registration and the OS
 * listeners only run for a signed-in user (never on the auth/onboarding screens),
 * mirroring how the chat unread poll stays below the auth guard. A tapped
 * notification is routed to its deep-link target.
 */
import { useRouter } from 'expo-router';

import { useAuth } from '@features/auth';

import { useNotificationObserver } from '../hooks/useNotificationObserver';
import { useRegisterPushToken } from '../hooks/useRegisterPushToken';

export function NotificationsBridge() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useRegisterPushToken(isAuthenticated);
  useNotificationObserver({
    enabled: isAuthenticated,
    onOpen: (route) => router.push(route),
  });

  return null;
}
