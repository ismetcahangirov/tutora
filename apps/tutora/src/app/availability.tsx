/**
 * `/availability` — the tutor's weekly schedule (issues #51, #55).
 *
 * Lives at the root stack (not inside the `(tutor)` tabs) so it pushes full-screen
 * over the tab bar, mirroring `/subscription`. Reached from the Profile tab. Back
 * returns to the previous screen, falling back to the app root.
 */
import { useRouter } from 'expo-router';

import { AvailabilityScreen } from '@features/availability';

export default function AvailabilityRoute() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return <AvailabilityScreen onBack={goBack} />;
}
