/**
 * `/favorites` — the student Favorites tab (issues #40, #45).
 *
 * Thin route wrapper around the tutors feature's `FavoritesScreen`; owns only
 * navigation into a profile.
 */
import { useRouter } from 'expo-router';

import { FavoritesScreen } from '@features/tutors';

export default function FavoritesTab() {
  const router = useRouter();

  return (
    <FavoritesScreen
      onPressTutor={(id) => router.push({ pathname: '/tutor/[id]', params: { id } })}
    />
  );
}
