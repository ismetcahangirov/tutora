/**
 * `/tutor/[id]` — the tutor profile screen (issues #40, #44).
 *
 * Lives at the root stack (not inside the `(student)` tabs) so it pushes over the
 * tab bar as a full-screen detail. Tutor profiles are public data, so no auth
 * guard is needed; the screen owns its own header + back navigation.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';

import { type ChatThread } from '@features/chat';
import { TutorDetailScreen } from '@features/tutors';

export default function TutorDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Cold deep link with no history — hand off to the routing gate, which
      // resolves the correct landing route for the user's auth state.
      router.replace('/');
    }
  };

  const handleContact = (thread: ChatThread) => {
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: thread.id,
        name: thread.counterpart.name ?? '',
        avatarUrl: thread.counterpart.avatarUrl ?? '',
      },
    });
  };

  return <TutorDetailScreen id={id ?? ''} onBack={handleBack} onContact={handleContact} />;
}
