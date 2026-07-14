/**
 * Subscription write hooks (#58) — subscribe / cancel each call the API and, on
 * success, invalidate every subscription query so the summary and history refresh.
 * The API module is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { cancelSubscription, subscribeToPlan } from '@features/subscription/api/subscription.api';
import { subscriptionKeys } from '@features/subscription/constants';
import type { Subscription } from '@features/subscription/types';

import { useCancelSubscription } from '../useCancelSubscription';
import { useSubscribeToPlan } from '../useSubscribeToPlan';

jest.mock('@features/subscription/api/subscription.api', () => ({
  subscribeToPlan: jest.fn(),
  cancelSubscription: jest.fn(),
}));

const mockedSubscribe = subscribeToPlan as jest.MockedFunction<typeof subscribeToPlan>;
const mockedCancel = cancelSubscription as jest.MockedFunction<typeof cancelSubscription>;

const SUBSCRIPTION = { id: 's1', tier: 'PRO', status: 'ACTIVE' } as unknown as Subscription;

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

describe('useSubscribeToPlan (#58)', () => {
  it('subscribes by tier and invalidates the subscription queries', async () => {
    mockedSubscribe.mockResolvedValueOnce(SUBSCRIPTION);
    const { wrapper, invalidateSpy } = setup();

    const { result } = await renderHook(() => useSubscribeToPlan(), { wrapper });
    await act(async () => {
      await result.current.subscribe({ tier: 'PRO' });
    });

    expect(mockedSubscribe).toHaveBeenCalledWith({ tier: 'PRO' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: subscriptionKeys.all });
  });
});

describe('useCancelSubscription (#58)', () => {
  it('cancels and invalidates the subscription queries', async () => {
    mockedCancel.mockResolvedValueOnce({ ...SUBSCRIPTION, status: 'CANCELED' });
    const { wrapper, invalidateSpy } = setup();

    const { result } = await renderHook(() => useCancelSubscription(), { wrapper });
    await act(async () => {
      await result.current.cancel();
    });

    expect(mockedCancel).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: subscriptionKeys.all });
  });
});
