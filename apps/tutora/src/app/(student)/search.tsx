/**
 * `/search` — the student Search tab (issues #40, #43).
 *
 * Thin route wrapper. Reads an optional `subjectId` (deep-linked from a Home
 * quick-filter) to preselect a subject, and owns navigation into a profile.
 *
 * The tab stays mounted across navigations, so a fresh subject arriving from Home
 * would otherwise be ignored (the screen seeds its selection once, on mount).
 * Keying the screen on `subjectId` remounts it for each distinct subject, so the
 * preselected filter always reflects the incoming param — without a state-syncing
 * effect.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TutorSearchScreen } from '@features/tutors';

export default function SearchTab() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();

  return (
    <TutorSearchScreen
      key={subjectId ?? 'all'}
      initialSubjectId={subjectId}
      onPressTutor={(id) => router.push({ pathname: '/tutor/[id]', params: { id } })}
    />
  );
}
