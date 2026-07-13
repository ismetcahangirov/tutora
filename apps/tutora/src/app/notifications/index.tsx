/**
 * `/notifications` — the in-app notification feed (issues #40, #50).
 *
 * Lives at the root stack (not inside the `(student)` tabs) so it pushes
 * full-screen over the tab bar, mirroring `/reviews` and `/chat/[id]`. Reached
 * from the Profile tab. Owns only navigation: back, and following a notification's
 * deep-link to its target screen.
 */
import { useRouter } from 'expo-router';

import { NotificationsScreen } from '@features/notifications';

export default function NotificationsRoute() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return <NotificationsScreen onBack={goBack} onOpen={(route) => router.push(route)} />;
}
