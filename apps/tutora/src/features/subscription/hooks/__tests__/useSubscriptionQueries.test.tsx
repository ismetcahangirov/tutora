/**
 * Subscription read hooks (#58) — plans, the caller's summary, and payment
 * history each fetch through the API (mocked) and expose a typed, named-field API.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  getPayments,
  getSubscriptionPlans,
  getSubscriptionSummary,
} from '@features/subscription/api/subscription.api';
import type { EntitlementSummary, Payment, SubscriptionPlan } from '@features/subscription/types';

import { usePayments } from '../usePayments';
import { useSubscriptionPlans } from '../useSubscriptionPlans';
import { useSubscriptionSummary } from '../useSubscriptionSummary';

jest.mock('@features/subscription/api/subscription.api', () => ({
  getSubscriptionPlans: jest.fn(),
  getSubscriptionSummary: jest.fn(),
  getPayments: jest.fn(),
}));

const mockedPlans = getSubscriptionPlans as jest.MockedFunction<typeof getSubscriptionPlans>;
const mockedSummary = getSubscriptionSummary as jest.MockedFunction<typeof getSubscriptionSummary>;
const mockedPayments = getPayments as jest.MockedFunction<typeof getPayments>;

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper };
}

const PRO_PLAN = { id: 'p1', tier: 'PRO', name: 'Pro' } as unknown as SubscriptionPlan;
const SUMMARY = { tier: 'FREE', subscription: null } as unknown as EntitlementSummary;
const PAYMENT = { id: 'pay1', amount: 9.9 } as unknown as Payment;

describe('useSubscriptionPlans (#58)', () => {
  it('exposes the fetched plans list', async () => {
    mockedPlans.mockResolvedValueOnce([PRO_PLAN]);

    const { result } = await renderHook(() => useSubscriptionPlans(), { wrapper: setup().wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plans).toEqual([PRO_PLAN]);
  });

  it('defaults to an empty list before the fetch resolves', async () => {
    let resolve: (plans: SubscriptionPlan[]) => void = () => {};
    mockedPlans.mockReturnValueOnce(
      new Promise<SubscriptionPlan[]>((r) => {
        resolve = r;
      }),
    );

    const { result } = await renderHook(() => useSubscriptionPlans(), { wrapper: setup().wrapper });

    expect(result.current.plans).toEqual([]);

    // Settle the query so the test leaves no pending fetch behind.
    resolve([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});

describe('useSubscriptionSummary (#58)', () => {
  it('exposes the fetched billing summary', async () => {
    mockedSummary.mockResolvedValueOnce(SUMMARY);

    const { result } = await renderHook(() => useSubscriptionSummary(), {
      wrapper: setup().wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.summary).toEqual(SUMMARY);
  });
});

describe('usePayments (#58)', () => {
  it('exposes the fetched payments and total', async () => {
    mockedPayments.mockResolvedValueOnce({
      data: [PAYMENT],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    });

    const { result } = await renderHook(() => usePayments(), { wrapper: setup().wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.payments).toEqual([PAYMENT]);
    expect(result.current.total).toBe(1);
  });

  it('requests the first page at the default size', async () => {
    mockedPayments.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
    });

    const { result } = await renderHook(() => usePayments(), { wrapper: setup().wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedPayments).toHaveBeenCalledWith(1, 20);
  });
});
