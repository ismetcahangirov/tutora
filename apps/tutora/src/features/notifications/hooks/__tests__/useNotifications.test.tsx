/**
 * useNotifications (#50) — the infinite query flattens pages and appends the next
 * page on demand. The API module is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { listNotifications } from '@features/notifications/api/notifications.api';
import type { AppNotification, Paginated } from '@features/notifications/types';

import { useNotifications } from '../useNotifications';

jest.mock('@features/notifications/api/notifications.api', () => ({
  listNotifications: jest.fn(),
}));
const mockedList = listNotifications as jest.MockedFunction<typeof listNotifications>;

function makeNotification(id: string): AppNotification {
  return {
    id,
    type: 'SYSTEM',
    title: `Notification ${id}`,
    body: 'Body',
    data: null,
    isRead: false,
    readAt: null,
    createdAt: '2026-07-13T10:00:00.000Z',
  };
}

function makePage(
  id: string,
  overrides: Partial<Paginated<AppNotification>['meta']>,
): Paginated<AppNotification> {
  return {
    data: [makeNotification(id)],
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

describe('useNotifications (#50)', () => {
  it('flattens the first page and exposes total + hasNextPage', async () => {
    mockedList.mockResolvedValueOnce(makePage('n1', { hasNext: true }));

    const { result } = await renderHook(() => useNotifications(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.total).toBe(2);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('appends the next page when fetchNextPage is called', async () => {
    mockedList
      .mockResolvedValueOnce(makePage('n1', { page: 1, hasNext: true }))
      .mockResolvedValueOnce(makePage('n2', { page: 2, hasNext: false }));

    const { result } = await renderHook(() => useNotifications(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
    act(() => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.notifications).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
  });
});
