/**
 * chat API — threads, messages, and read state via the shared client (#40, #47).
 *
 * Every endpoint is authenticated (the client attaches the bearer token and
 * refreshes transparently). Lists return the standard paginated envelope; sends
 * return the created message so the UI can reconcile its optimistic copy.
 */
import { apiClient } from '@/shared/lib';

import { CHAT_ENDPOINTS } from '../constants';
import type { ChatMessage, ChatPageParams, ChatThread, Paginated } from '../types';

/** Drop `undefined` paging keys so the request URL stays clean and cacheable. */
function toPagingParams(params: ChatPageParams): Record<string, number> {
  const query: Record<string, number> = {};
  if (params.page !== undefined) {
    query.page = params.page;
  }
  if (params.limit !== undefined) {
    query.limit = params.limit;
  }
  return query;
}

/** GET a page of the caller's threads, most-recently-active first. */
export async function listThreads(params: ChatPageParams): Promise<Paginated<ChatThread>> {
  const { data } = await apiClient.get<Paginated<ChatThread>>(CHAT_ENDPOINTS.threads, {
    params: toPagingParams(params),
  });
  return data;
}

/** GET a page of a thread's messages, newest first. */
export async function listMessages(
  threadId: string,
  params: ChatPageParams,
): Promise<Paginated<ChatMessage>> {
  const { data } = await apiClient.get<Paginated<ChatMessage>>(CHAT_ENDPOINTS.messages(threadId), {
    params: toPagingParams(params),
  });
  return data;
}

/** POST a new message to a thread and return the persisted message. */
export async function sendMessage(threadId: string, body: string): Promise<ChatMessage> {
  const { data } = await apiClient.post<ChatMessage>(CHAT_ENDPOINTS.messages(threadId), {
    body: body.trim(),
  });
  return data;
}

/** Mark the counterparty's unread messages in a thread as read. */
export async function markThreadRead(threadId: string): Promise<{ readCount: number }> {
  const { data } = await apiClient.post<{ readCount: number }>(CHAT_ENDPOINTS.read(threadId));
  return data;
}

/** GET the caller's total unread messages across all threads (tab badge). */
export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>(CHAT_ENDPOINTS.unreadCount);
  return data;
}
