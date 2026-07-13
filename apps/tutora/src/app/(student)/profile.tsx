/**
 * `/profile` — the student Profile tab (issues #40, #49).
 *
 * Thin route wrapper around the profile feature's `ProfileScreen`; owns only the
 * navigation out of it — applying a saved search opens the Search tab pre-filled
 * with that preset (the Search screen re-mounts on the `presetId` param).
 */
import { useRouter } from 'expo-router';

import { ProfileScreen } from '@features/profile';

export default function ProfileTab() {
  const router = useRouter();

  return (
    <ProfileScreen
      onApplySavedSearch={(id) => router.push({ pathname: '/search', params: { presetId: id } })}
      onOpenMyReviews={() => router.push('/reviews')}
    />
  );
}
