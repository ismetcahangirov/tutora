/**
 * Chat feature — public barrel (student epic #40, #47).
 *
 * The messaging surface: the Messages tab (conversation list), a thread view, and
 * the tab-bar icon with its unread badge. Import from here into the route files:
 *   `import { MessagesScreen, ChatThreadScreen } from '@features/chat';`
 */
export { MessagesScreen, type MessagesScreenProps } from './screens/MessagesScreen';
export { ChatThreadScreen, type ChatThreadScreenProps } from './screens/ChatThreadScreen';

export { MessagesTabIcon, type MessagesTabIconProps } from './components/MessagesTabIcon';

export { useUnreadCount, type UseUnreadCountResult } from './hooks/useUnreadCount';
export {
  useStartThreadWithTutor,
  type UseStartThreadWithTutorResult,
} from './hooks/useStartThreadWithTutor';
export { NoActiveApplicationError } from './api/chat.api';

export type { ChatThread, ChatMessage, ChatCounterpart } from './types';
