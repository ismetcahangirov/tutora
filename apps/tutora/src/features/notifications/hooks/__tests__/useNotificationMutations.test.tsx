/**
 * Notification read hooks (#50) — mark-one and mark-all call the API and, on
 * success, invalidate every notification query so the feed and badge refresh.
 * Mark-all only invalidates when something actually changed. The API is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@features/notifications/api/notifications.api';
import { notificationKeys } from '@features/notifications/constants';
import type { AppNotification } from '@features/notifications/types';

import { useMarkAllNotificationsRead } from '../useMarkAllNotificationsRead';
import { useMarkNotificationRead } from '../useMarkNotificationRead';

jest.mock('@features/notifications/api/notifications.api', () => ({
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
}));

const mockedMarkRead = markNotificationRead as jest.MockedFunction<typeof markNotificationRead>;
const mockedMarkAll = markAllNotificationsRead as jest.MockedFunction<
  typeof markAllNotificationsRead
>;

const read: AppNotification = {
  id: 'n1',
  type: 'SYSTEM',
  title: 'Hi',
  body: 'Body',
  data: null,
  isRead: true,
  readAt: '2026-07-13T10:00:00.000Z',
  createdAt: '2026-07-13T09:00:00.000Z',
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateSpy };
}

describe('useMarkNotificationRead (#50)', () => {
  it('marks one read and invalidates the notification queries', async () => {
    mockedMarkRead.mockResolvedValueOnce(read);
    const { wrapper, invalidateSpy } = setup();

    const { result } = await renderHook(() => useMarkNotificationRead(), { wrapper });
    await act(async () => {
      result.current.markRead('n1');
    });

    expect(mockedMarkRead).toHaveBeenCalledWith('n1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: notificationKeys.all });
  });
});

describe('useMarkAllNotificationsRead (#50)', () => {
  it('invalidates when at least one notification changed', async () => {
    mockedMarkAll.mockResolvedValueOnce({ readCount: 2 });
    const { wrapper, invalidateSpy } = setup();

    const { result } = await renderHook(() => useMarkAllNotificationsRead(), { wrapper });
    await act(async () => {
      await result.current.markAll();
    });

    expect(mockedMarkAll).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: notificationKeys.all });
  });

  it('skips invalidation when nothing was unread', async () => {
    mockedMarkAll.mockResolvedValueOnce({ readCount: 0 });
    const { wrapper, invalidateSpy } = setup();

    const { result } = await renderHook(() => useMarkAllNotificationsRead(), { wrapper });
    await act(async () => {
      await result.current.markAll();
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
