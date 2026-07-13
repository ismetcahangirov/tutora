/**
 * Chat feature — endpoints, query keys, defaults (student epic #40, #47).
 *
 * User-facing copy lives in the i18n catalogs under `chat.*`; this file holds
 * only stable, non-localized constants.
 */

/** Authenticated chat endpoints, appended to `EXPO_PUBLIC_API_URL`. */
export const CHAT_ENDPOINTS = {
  threads: '/api/v1/chat/threads',
  unreadCount: '/api/v1/chat/unread-count',
  /** Messages of a thread: `/threads/:id/messages`. */
  messages: (threadId: string) => `/api/v1/chat/threads/${threadId}/messages`,
  /** Mark a thread read: `/threads/:id/read`. */
  read: (threadId: string) => `/api/v1/chat/threads/${threadId}/read`,
} as const;

/** Default page size for threads and messages. Matches the backend default. */
export const DEFAULT_PAGE_SIZE = 20;

/** Upper bound on a single message body. Mirrors the backend `SendMessageDto`. */
export const MESSAGE_MAX_LENGTH = 4000;

/**
 * How often the open thread refetches while visible. Absent WebSockets (a later
 * enhancement over the #34 gateway), a modest poll keeps an open conversation
 * live without hammering the API.
 */
export const MESSAGES_POLL_INTERVAL = 12_000;

/** How often the unread badge refreshes while the app is mounted. */
export const UNREAD_POLL_INTERVAL = 30_000;

/** Badge caps out here so a large count never blows out the tab bar. */
export const UNREAD_BADGE_MAX = 99;

/**
 * Structured query keys. Message keys are per-thread so each conversation caches
 * and invalidates independently.
 */
export const chatKeys = {
  all: ['chat'] as const,
  threads: () => [...chatKeys.all, 'threads'] as const,
  messages: (threadId: string) => [...chatKeys.all, 'messages', threadId] as const,
  unreadCount: () => [...chatKeys.all, 'unread-count'] as const,
};
