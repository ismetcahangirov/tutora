/**
 * `/chat/[id]` — a single conversation thread (issues #40, #47).
 *
 * Lives at the root stack (not inside the `(student)` tabs) so it pushes
 * full-screen over the tab bar, mirroring `/tutor/[id]`. The counterpart's name
 * and avatar arrive as params from the thread list; a cold deep link simply
 * shows a generic header until the messages load.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ChatThreadScreen } from '@features/chat';

export default function ChatThreadRoute() {
  const router = useRouter();
  const { id, name, avatarUrl } = useLocalSearchParams<{
    id: string;
    name?: string;
    avatarUrl?: string;
  }>();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Cold deep link with no history — hand off to the routing gate.
      router.replace('/');
    }
  };

  return (
    <ChatThreadScreen
      threadId={id ?? ''}
      title={name || null}
      avatarUrl={avatarUrl || null}
      onBack={handleBack}
    />
  );
}
