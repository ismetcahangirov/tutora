/**
 * `/subscription` — the tutor's membership hub (issues #51, #58).
 *
 * Lives at the root stack (not inside the `(tutor)` tabs) so it pushes full-screen
 * over the tab bar, mirroring `/reviews` and `/chat/[id]`. Reached from the Profile
 * tab. Back returns to the previous screen, falling back to the app root.
 */
import { useRouter } from 'expo-router';

import { SubscriptionScreen } from '@features/subscription';

export default function SubscriptionRoute() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return <SubscriptionScreen onBack={goBack} />;
}
