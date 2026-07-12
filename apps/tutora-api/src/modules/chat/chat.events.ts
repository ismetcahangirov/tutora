/** Socket.io namespace, room helpers and event contract for chat (#34). */

export const CHAT_NAMESPACE = '/chat';
export const THREAD_ROOM_PREFIX = 'thread:';
export const USER_ROOM_PREFIX = 'user:';

/** Room every participant of a thread joins to receive its live events. */
export const threadRoom = (threadId: string): string => `${THREAD_ROOM_PREFIX}${threadId}`;
/** Personal room a connected user joins for cross-thread notifications. */
export const userRoom = (userId: string): string => `${USER_ROOM_PREFIX}${userId}`;

export const CHAT_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  TYPING: 'typing',
  PRESENCE: 'presence',
  THREAD_JOIN: 'thread:join',
  THREAD_LEAVE: 'thread:leave',
} as const;

export interface ReadReceipt {
  threadId: string;
  readerUserId: string;
  readAt: Date;
}

export interface PresenceEvent {
  userId: string;
  status: 'online' | 'offline';
}

export interface TypingEvent {
  threadId: string;
  userId: string;
  isTyping: boolean;
}
