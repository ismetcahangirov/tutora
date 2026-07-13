/**
 * Pure updaters for the infinite messages cache (#47).
 *
 * Kept out of the hook so optimistic insert / replace / status / remove are
 * trivially unit-testable and side-effect free. All operate on the newest-first
 * `InfiniteData` shape TanStack Query stores; new (optimistic) messages always
 * belong at the head of the first page.
 */
import type { InfiniteData } from '@tanstack/react-query';

import type { ChatMessage, MessageDeliveryStatus, Paginated } from './types';

export type MessagesCache = InfiniteData<Paginated<ChatMessage>>;

/** A single-message page used when inserting before any page has loaded. */
function seedPage(message: ChatMessage): Paginated<ChatMessage> {
  return {
    data: [message],
    meta: { page: 1, limit: 1, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
  };
}

/** Insert a message at the head of the newest page (top of an inverted list). */
export function prependMessage(
  cache: MessagesCache | undefined,
  message: ChatMessage,
): MessagesCache {
  const firstPage = cache?.pages[0];
  if (!cache || !firstPage) {
    return { pageParams: [1], pages: [seedPage(message)] };
  }
  const merged: Paginated<ChatMessage> = { ...firstPage, data: [message, ...firstPage.data] };
  return { ...cache, pages: [merged, ...cache.pages.slice(1)] };
}

/** Map every message across all pages through `fn`. */
function mapMessages(
  cache: MessagesCache | undefined,
  fn: (message: ChatMessage) => ChatMessage,
): MessagesCache | undefined {
  if (!cache) {
    return cache;
  }
  return {
    ...cache,
    pages: cache.pages.map((page) => ({ ...page, data: page.data.map(fn) })),
  };
}

/** Swap the message with `id` for `replacement` (optimistic → server message). */
export function replaceMessage(
  cache: MessagesCache | undefined,
  id: string,
  replacement: ChatMessage,
): MessagesCache | undefined {
  return mapMessages(cache, (message) => (message.id === id ? replacement : message));
}

/** Update the delivery status of the message with `id` in place. */
export function updateMessageStatus(
  cache: MessagesCache | undefined,
  id: string,
  deliveryStatus: MessageDeliveryStatus,
): MessagesCache | undefined {
  return mapMessages(cache, (message) =>
    message.id === id ? { ...message, deliveryStatus } : message,
  );
}

/** Drop the message with `id` from every page. */
export function removeMessage(
  cache: MessagesCache | undefined,
  id: string,
): MessagesCache | undefined {
  if (!cache) {
    return cache;
  }
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      data: page.data.filter((message) => message.id !== id),
    })),
  };
}
