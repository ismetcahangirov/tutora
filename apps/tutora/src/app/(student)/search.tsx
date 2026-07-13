/**
 * `/search` — the student Search tab (issues #40, #43, #49).
 *
 * Thin route wrapper. Reads an optional `subjectId` (deep-linked from a Home
 * quick-filter) or a `presetId` (a saved search applied from the Profile tab) and
 * seeds the screen accordingly; owns navigation into a profile.
 *
 * The tab stays mounted across navigations, so a fresh subject/preset arriving
 * from another tab would otherwise be ignored (the screen seeds its state once, on
 * mount). Keying the screen on the incoming param remounts it for each distinct
 * subject or preset, so the seeded filters always reflect the param — without a
 * state-syncing effect.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getSavedSearchById } from '@features/saved-searches';
import { TutorSearchScreen } from '@features/tutors';

export default function SearchTab() {
  const router = useRouter();
  const { subjectId, presetId } = useLocalSearchParams<{
    subjectId?: string;
    presetId?: string;
  }>();
  const preset = presetId ? getSavedSearchById(presetId) : undefined;

  return (
    <TutorSearchScreen
      key={presetId ?? subjectId ?? 'all'}
      initialSubjectId={subjectId}
      initialSelection={preset?.selection}
      initialQuery={preset?.query}
      onPressTutor={(id) => router.push({ pathname: '/tutor/[id]', params: { id } })}
    />
  );
}
