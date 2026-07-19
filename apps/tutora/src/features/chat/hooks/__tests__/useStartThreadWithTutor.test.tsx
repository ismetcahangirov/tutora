/**
 * useStartThreadWithTutor (#171/#173) — opens a thread with a tutor, resolves
 * with the thread on success, and invalidates the thread list cache. The API
 * module is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { NoActiveApplicationError, startThreadWithTutor } from '@features/chat/api/chat.api';
import { chatKeys } from '@features/chat/constants';
import type { ChatThread } from '@features/chat/types';

import { useStartThreadWithTutor } from '../useStartThreadWithTutor';

jest.mock('@features/chat/api/chat.api', () => {
  const actual = jest.requireActual('@features/chat/api/chat.api');
  return { ...actual, startThreadWithTutor: jest.fn() };
});

const mockedStart = startThreadWithTutor as jest.MockedFunction<typeof startThreadWithTutor>;

const thread: ChatThread = {
  id: 'th1',
  counterpart: { userId: 'u2', name: 'Aygün', avatarUrl: null, role: 'TUTOR' },
  lastMessage: null,
  unreadCount: 0,
  lastMessageAt: null,
  createdAt: '2026-07-13T09:00:00.000Z',
};

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useStartThreadWithTutor (#171/#173)', () => {
  it('resolves with the opened thread and invalidates the thread list', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
    });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    mockedStart.mockResolvedValueOnce(thread);

    const { result } = await renderHook(() => useStartThreadWithTutor(), {
      wrapper: wrapperFor(client),
    });

    let resolved: ChatThread | undefined;
    await act(async () => {
      resolved = await result.current.startThread('tutor-1');
    });

    expect(mockedStart).toHaveBeenCalledWith('tutor-1');
    expect(resolved).toEqual(thread);
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: chatKeys.threads() }),
    );
  });

  it('rejects with NoActiveApplicationError when the caller has no application', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
    });
    mockedStart.mockRejectedValueOnce(new NoActiveApplicationError());

    const { result } = await renderHook(() => useStartThreadWithTutor(), {
      wrapper: wrapperFor(client),
    });

    await expect(
      act(async () => {
        await result.current.startThread('tutor-1');
      }),
    ).rejects.toBeInstanceOf(NoActiveApplicationError);
  });
});
