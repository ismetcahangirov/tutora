/**
 * useSendMessage — optimistic message sending for a thread (#47).
 *
 * The message appears instantly (as `sending`), so the composer feels native.
 * On success the optimistic copy is swapped for the server message; on failure
 * it flips to `failed` and stays put so the user can retry it. Sends never
 * duplicate: a fresh optimistic id ties the placeholder to its server result.
 * After a successful send the thread list is invalidated so its last-message
 * preview and ordering catch up.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@features/auth';

import { sendMessage } from '../api/chat.api';
import { chatKeys } from '../constants';
import {
  prependMessage,
  removeMessage,
  replaceMessage,
  updateMessageStatus,
  type MessagesCache,
} from '../message-cache';
import type { ChatMessage } from '../types';

export type UseSendMessageResult = {
  /** Send trimmed `body`; no-op when empty. */
  send: (body: string) => void;
  /** Discard a failed message and send its body again. */
  retry: (message: ChatMessage) => void;
  isSending: boolean;
};

// Monotonic within the session — pairs an optimistic placeholder to its result.
let optimisticSeq = 0;
function nextOptimisticId(): string {
  optimisticSeq += 1;
  return `optimistic-${Date.now()}-${optimisticSeq}`;
}

type SendVariables = { body: string; optimisticId: string };

export function useSendMessage(threadId: string): UseSendMessageResult {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const key = chatKeys.messages(threadId);

  const mutation = useMutation({
    mutationFn: ({ body }: SendVariables) => sendMessage(threadId, body),
    onMutate: async ({ body, optimisticId }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const optimistic: ChatMessage = {
        id: optimisticId,
        threadId,
        senderId: user?.id ?? '',
        body,
        readAt: null,
        createdAt: new Date().toISOString(),
        isMine: true,
        deliveryStatus: 'sending',
      };
      queryClient.setQueryData<MessagesCache>(key, (cache) => prependMessage(cache, optimistic));
    },
    onSuccess: (serverMessage, { optimisticId }) => {
      queryClient.setQueryData<MessagesCache>(key, (cache) =>
        replaceMessage(cache, optimisticId, serverMessage),
      );
      void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
    onError: (_error, { optimisticId }) => {
      queryClient.setQueryData<MessagesCache>(key, (cache) =>
        updateMessageStatus(cache, optimisticId, 'failed'),
      );
    },
  });

  const send = (body: string): void => {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    mutation.mutate({ body: trimmed, optimisticId: nextOptimisticId() });
  };

  const retry = (message: ChatMessage): void => {
    queryClient.setQueryData<MessagesCache>(key, (cache) => removeMessage(cache, message.id));
    send(message.body);
  };

  return { send, retry, isSending: mutation.isPending };
}
