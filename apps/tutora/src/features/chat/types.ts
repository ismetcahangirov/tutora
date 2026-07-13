/**
 * Chat feature — API contract types (student epic #40, #47; backend #34).
 *
 * These mirror the backend's `ThreadView` / `MessageView` DTOs, with one honest
 * difference: timestamps arrive as ISO strings over JSON (not `Date`), so every
 * date field is typed `string | null`. Two views exist — a `ChatThread` for the
 * conversation list and a `ChatMessage` for the thread history.
 */

import type { UserRole } from '@features/auth';

// Re-export the shared pagination envelope so chat consumers can import it from
// the feature barrel alongside the chat types.
export type { Paginated, PaginationMeta } from '@/shared';

/** The other party in a 1:1 thread, resolved by the backend for the caller. */
export type ChatCounterpart = {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

/** Compact preview of a thread's latest message, shown in the conversation list. */
export type ChatMessagePreview = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
};

/** A conversation as returned by `GET /api/v1/chat/threads`. */
export type ChatThread = {
  id: string;
  counterpart: ChatCounterpart;
  lastMessage: ChatMessagePreview | null;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
};

/**
 * Delivery state of a message the caller sent. `sending`/`failed` only ever apply
 * to optimistic (client-only) messages; anything from the server is `sent`.
 */
export type MessageDeliveryStatus = 'sending' | 'sent' | 'failed';

/** A single message as returned by the thread messages endpoint. */
export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  /** Resolved by the backend: true when the caller is the sender. */
  isMine: boolean;
  /**
   * Client-only optimistic flag. Absent on server messages; set while an
   * outgoing message is in flight so the bubble can show a pending/failed state.
   */
  deliveryStatus?: MessageDeliveryStatus;
};

/** Paging for the thread list and message history. */
export type ChatPageParams = {
  page?: number;
  limit?: number;
};
