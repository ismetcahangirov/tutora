/**
 * useThreads (#47) — the infinite query flattens pages and appends the next page
 * on demand. The API module is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { listThreads } from '@features/chat/api/chat.api';
import type { ChatThread, Paginated } from '@features/chat/types';

import { useThreads } from '../useThreads';

jest.mock('@features/chat/api/chat.api', () => ({ listThreads: jest.fn() }));
// The hook gates its query on the session; a signed-in user keeps it enabled.
jest.mock('@features/auth', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
const mockedList = listThreads as jest.MockedFunction<typeof listThreads>;

function makeThread(id: string): ChatThread {
  return {
    id,
    counterpart: { userId: `u-${id}`, name: 'Aygün', avatarUrl: null, role: 'TUTOR' },
    lastMessage: null,
    unreadCount: 0,
    lastMessageAt: null,
    createdAt: '2026-07-10T09:00:00.000Z',
  };
}

function makePage(
  id: string,
  overrides: Partial<Paginated<ChatThread>['meta']>,
): Paginated<ChatThread> {
  return {
    data: [makeThread(id)],
    meta: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 2,
      hasNext: false,
      hasPrev: false,
      ...overrides,
    },
  };
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useThreads (#47)', () => {
  it('flattens the first page and exposes total + hasNextPage', async () => {
    mockedList.mockResolvedValueOnce(makePage('t1', { hasNext: true }));

    const { result } = await renderHook(() => useThreads(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.threads).toHaveLength(1);
    expect(result.current.total).toBe(2);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('appends the next page when fetchNextPage is called', async () => {
    mockedList
      .mockResolvedValueOnce(makePage('t1', { page: 1, hasNext: true }))
      .mockResolvedValueOnce(makePage('t2', { page: 2, hasNext: false }));

    const { result } = await renderHook(() => useThreads(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.threads).toHaveLength(1));
    act(() => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.threads).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
  });
});
