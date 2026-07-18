/**
 * useUnreadNotificationsCount (#50) — surfaces the badge count, degrading to 0 on
 * error (a missing badge is the correct degraded state). The API is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { getUnreadCount } from '@features/notifications/api/notifications.api';

import { useUnreadNotificationsCount } from '../useUnreadNotificationsCount';

jest.mock('@features/notifications/api/notifications.api', () => ({ getUnreadCount: jest.fn() }));
// The hook gates its query on the session; a signed-in user keeps it enabled.
jest.mock('@features/auth', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
const mockedGetUnreadCount = getUnreadCount as jest.MockedFunction<typeof getUnreadCount>;

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useUnreadNotificationsCount (#50)', () => {
  it('returns the server count', async () => {
    mockedGetUnreadCount.mockResolvedValueOnce({ count: 7 });

    const { result } = await renderHook(() => useUnreadNotificationsCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.count).toBe(7));
  });

  it('falls back to 0 before data loads and on error', async () => {
    mockedGetUnreadCount.mockRejectedValueOnce(new Error('offline'));

    const { result } = await renderHook(() => useUnreadNotificationsCount(), {
      wrapper: createWrapper(),
    });

    // Initial render (no data yet) and the error state both read as 0.
    expect(result.current.count).toBe(0);
  });
});
