/**
 * `/messages` — the student Messages tab (issues #41, #47).
 *
 * Renders the conversation list and pushes the tapped thread onto the root stack
 * (`/chat/[id]`), passing the counterpart's name + avatar as params so the thread
 * header renders instantly without a second fetch.
 */
import { useRouter } from 'expo-router';

import { MessagesScreen } from '@features/chat';

export default function MessagesTab() {
  const router = useRouter();

  return (
    <MessagesScreen
      onOpenThread={(thread) =>
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: thread.id,
            name: thread.counterpart.name ?? '',
            avatarUrl: thread.counterpart.avatarUrl ?? '',
          },
        })
      }
    />
  );
}
