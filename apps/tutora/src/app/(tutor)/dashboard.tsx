/**
 * `/dashboard` — the tutor Dashboard tab (tutor epic #51, #52).
 *
 * Thin route wrapper around the dashboard feature's screen; owns only the
 * navigation out of it — the profile-management and pending-application jumps both
 * switch to a sibling tab. Guarded upstream by the `(tutor)` layout.
 */
import { useRouter } from 'expo-router';

import { TutorDashboardScreen } from '@features/tutor-dashboard';

export default function TutorDashboardRoute() {
  const router = useRouter();

  return (
    <TutorDashboardScreen
      onEditProfile={() => router.navigate('/account')}
      onViewApplications={() => router.navigate('/applications')}
    />
  );
}
