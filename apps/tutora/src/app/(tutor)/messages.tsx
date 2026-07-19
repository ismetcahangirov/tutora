/**
 * `/messages` — the tutor Messages tab (issue #171/#179).
 *
 * Mirrors the student Messages tab exactly: renders the conversation list and
 * pushes the tapped thread onto the root stack (`/chat/[id]`), passing the
 * counterpart's name + avatar so the thread header renders instantly.
 */
import { useRouter } from 'expo-router';

import { MessagesScreen } from '@features/chat';

export default function TutorMessagesTab() {
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
