/**
 * `/compare` — the side-by-side tutor comparison (issues #40, #46).
 *
 * Lives at the root stack (not inside the `(student)` tabs) so it pushes over the
 * tab bar as a full-screen view, mirroring `/tutor/[id]`. The selection itself
 * lives in the comparison store, so this route needs no params; it only owns
 * navigation (back + into a tutor's profile).
 */
import { useRouter } from 'expo-router';

import { ComparisonScreen } from '@features/tutors';

export default function CompareRoute() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ComparisonScreen
      onBack={handleBack}
      onPressTutor={(id) => router.push({ pathname: '/tutor/[id]', params: { id } })}
    />
  );
}
