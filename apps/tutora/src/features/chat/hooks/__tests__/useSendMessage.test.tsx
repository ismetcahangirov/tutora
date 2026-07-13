/**
 * useSendMessage (#47) — an outgoing message is inserted optimistically, then
 * reconciled with the server result on success or flipped to `failed` (and
 * retryable) on error. The API and auth context are mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { sendMessage } from '@features/chat/api/chat.api';
import { chatKeys } from '@features/chat/constants';
import type { MessagesCache } from '@features/chat/message-cache';
import type { ChatMessage } from '@features/chat/types';

import { useSendMessage } from '../useSendMessage';

jest.mock('@features/chat/api/chat.api', () => ({ sendMessage: jest.fn() }));
jest.mock('@features/auth', () => ({ useAuth: () => ({ user: { id: 'me' } }) }));

const mockedSend = sendMessage as jest.MockedFunction<typeof sendMessage>;
const THREAD_ID = 'th1';

const existing: ChatMessage = {
  id: 'srv0',
  threadId: THREAD_ID,
  senderId: 'u2',
  body: 'Salam',
  readAt: null,
  createdAt: '2026-07-13T09:00:00.000Z',
  isMine: false,
};

function seededClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  client.setQueryData<MessagesCache>(chatKeys.messages(THREAD_ID), {
    pageParams: [1],
    pages: [
      {
        data: [existing],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      },
    ],
  });
  return client;
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function topMessage(client: QueryClient): ChatMessage | undefined {
  return client.getQueryData<MessagesCache>(chatKeys.messages(THREAD_ID))?.pages[0]?.data[0];
}

describe('useSendMessage (#47)', () => {
  it('inserts optimistically then swaps in the server message on success', async () => {
    const client = seededClient();
    const serverMessage: ChatMessage = {
      id: 'srv1',
      threadId: THREAD_ID,
      senderId: 'me',
      body: 'Hello',
      readAt: null,
      createdAt: '2026-07-13T10:00:00.000Z',
      isMine: true,
    };
    mockedSend.mockResolvedValueOnce(serverMessage);

    const { result } = await renderHook(() => useSendMessage(THREAD_ID), {
      wrapper: wrapperFor(client),
    });
    await act(async () => {
      result.current.send('  Hello  ');
    });

    await waitFor(() => expect(topMessage(client)?.id).toBe('srv1'));
    expect(mockedSend).toHaveBeenCalledWith(THREAD_ID, 'Hello');
    expect(topMessage(client)?.deliveryStatus).toBeUndefined();
  });

  it('marks the message failed on error, then retry re-sends its body', async () => {
    const client = seededClient();
    mockedSend.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({
      id: 'srv2',
      threadId: THREAD_ID,
      senderId: 'me',
      body: 'Hi',
      readAt: null,
      createdAt: '2026-07-13T10:05:00.000Z',
      isMine: true,
    });

    const { result } = await renderHook(() => useSendMessage(THREAD_ID), {
      wrapper: wrapperFor(client),
    });
    await act(async () => {
      result.current.send('Hi');
    });

    await waitFor(() => expect(topMessage(client)?.deliveryStatus).toBe('failed'));

    const failed = topMessage(client);
    if (!failed) throw new Error('expected a failed message');
    await act(async () => {
      result.current.retry(failed);
    });

    await waitFor(() => expect(topMessage(client)?.id).toBe('srv2'));
    expect(mockedSend).toHaveBeenLastCalledWith(THREAD_ID, 'Hi');
  });

  it('ignores an empty body', async () => {
    const client = seededClient();
    const { result } = await renderHook(() => useSendMessage(THREAD_ID), {
      wrapper: wrapperFor(client),
    });

    await act(async () => {
      result.current.send('   ');
    });
    expect(mockedSend).not.toHaveBeenCalled();
  });
});
