/**
 * useNotificationObserver (#50) — wires the two OS listeners while enabled and
 * cleans them up on unmount. A tap resolves to a route; a foreground arrival
 * refreshes the cache. The native listeners are stubbed globally in jest-setup.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { Notification, NotificationResponse } from 'expo-notifications';
import type { ReactNode } from 'react';

import { notificationKeys } from '@features/notifications/constants';

import { useNotificationObserver } from '../useNotificationObserver';

const mockedReceivedAdd = jest.mocked(Notifications.addNotificationReceivedListener);
const mockedResponseAdd = jest.mocked(Notifications.addNotificationResponseReceivedListener);

function responseWith(data: Record<string, unknown>): NotificationResponse {
  return {
    notification: { request: { content: { data } } },
  } as unknown as NotificationResponse;
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateSpy };
}

describe('useNotificationObserver (#50)', () => {
  it('routes a tapped notification to its deep-link target', async () => {
    const { wrapper } = setup();
    const onOpen = jest.fn();

    await renderHook(() => useNotificationObserver({ enabled: true, onOpen }), { wrapper });

    const call = mockedResponseAdd.mock.calls[0];
    if (!call) {
      throw new Error('expected a response listener to be registered');
    }
    // Awaited act — a bare act() here leaks into and pollutes the next test.
    await act(async () => {
      call[0](responseWith({ threadId: 't1' }));
    });

    expect(onOpen).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 't1' } });
  });

  it('refreshes the cache when a notification arrives in the foreground', async () => {
    const { wrapper, invalidateSpy } = setup();

    await renderHook(() => useNotificationObserver({ enabled: true, onOpen: jest.fn() }), {
      wrapper,
    });

    const call = mockedReceivedAdd.mock.calls[0];
    if (!call) {
      throw new Error('expected a received listener to be registered');
    }
    await act(async () => {
      call[0]({} as Notification);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: notificationKeys.all });
  });

  it('removes both subscriptions on unmount', async () => {
    const { wrapper } = setup();

    const { unmount } = await renderHook(
      () => useNotificationObserver({ enabled: true, onOpen: jest.fn() }),
      { wrapper },
    );

    const receivedResult = mockedReceivedAdd.mock.results.at(-1);
    const responseResult = mockedResponseAdd.mock.results.at(-1);
    if (!receivedResult || !responseResult) {
      throw new Error('expected both subscriptions to be returned');
    }

    await act(async () => {
      unmount();
    });

    expect(receivedResult.value.remove).toHaveBeenCalled();
    expect(responseResult.value.remove).toHaveBeenCalled();
  });

  it('subscribes to nothing while disabled', async () => {
    const { wrapper } = setup();

    await renderHook(() => useNotificationObserver({ enabled: false, onOpen: jest.fn() }), {
      wrapper,
    });

    expect(mockedReceivedAdd).not.toHaveBeenCalled();
    expect(mockedResponseAdd).not.toHaveBeenCalled();
  });
});
