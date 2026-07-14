/**
 * `/account` — the tutor Profile tab (tutor epic #51, #53, #56).
 *
 * Thin route wrapper around the profile feature's editor screen. Named `account`
 * (not `profile`) so its flat URL never collides with the student group's Profile
 * tab; the tab *label* still reads "Profile". Guarded upstream by the `(tutor)`
 * layout.
 */
import { useRouter } from 'expo-router';

import { TutorProfileScreen } from '@features/tutor-profile';

export default function TutorAccountRoute() {
  const router = useRouter();
  return <TutorProfileScreen onManageSubscription={() => router.navigate('/subscription')} />;
}
