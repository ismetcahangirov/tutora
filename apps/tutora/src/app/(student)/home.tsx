/**
 * `/home` — the student Home tab (issues #40, #42).
 *
 * Thin route wrapper: it owns navigation and delegates all UI to the tutors
 * feature's `HomeScreen`. Guarded upstream by the `(student)` layout.
 */
import { useRouter } from 'expo-router';

import { HomeScreen } from '@features/tutors';

export default function HomeTab() {
  const router = useRouter();

  return (
    <HomeScreen
      onPressTutor={(id) => router.push({ pathname: '/tutor/[id]', params: { id } })}
      onPressSearch={() => router.push('/search')}
      onPressSubject={(subjectId) => router.push({ pathname: '/search', params: { subjectId } })}
    />
  );
}
