/**
 * SubscriptionScreen (#58) — renders the loading / error states, the plan
 * catalogue with a subscribe flow, and an active subscription with a cancel flow.
 * The feature hooks and toast are mocked.
 */
import { useToast } from '@/components/ui';
import { usePayments, type UsePaymentsResult } from '@features/subscription/hooks/usePayments';
import {
  useSubscriptionPlans,
  type UseSubscriptionPlansResult,
} from '@features/subscription/hooks/useSubscriptionPlans';
import {
  useSubscriptionSummary,
  type UseSubscriptionSummaryResult,
} from '@features/subscription/hooks/useSubscriptionSummary';
import { useSubscribeToPlan } from '@features/subscription/hooks/useSubscribeToPlan';
import { useCancelSubscription } from '@features/subscription/hooks/useCancelSubscription';
import type { Payment, Subscription, SubscriptionPlan } from '@features/subscription/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils';

import { SubscriptionScreen } from '../SubscriptionScreen';

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  useToast: jest.fn(),
}));
jest.mock('@features/subscription/hooks/useSubscriptionSummary', () => ({
  useSubscriptionSummary: jest.fn(),
}));
jest.mock('@features/subscription/hooks/useSubscriptionPlans', () => ({
  useSubscriptionPlans: jest.fn(),
}));
jest.mock('@features/subscription/hooks/usePayments', () => ({ usePayments: jest.fn() }));
jest.mock('@features/subscription/hooks/useSubscribeToPlan', () => ({
  useSubscribeToPlan: jest.fn(),
}));
jest.mock('@features/subscription/hooks/useCancelSubscription', () => ({
  useCancelSubscription: jest.fn(),
}));

const mockedSummary = useSubscriptionSummary as jest.MockedFunction<typeof useSubscriptionSummary>;
const mockedPlans = useSubscriptionPlans as jest.MockedFunction<typeof useSubscriptionPlans>;
const mockedPayments = usePayments as jest.MockedFunction<typeof usePayments>;
const mockedSubscribeHook = useSubscribeToPlan as jest.MockedFunction<typeof useSubscribeToPlan>;
const mockedCancelHook = useCancelSubscription as jest.MockedFunction<typeof useCancelSubscription>;
const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;

const FREE_PLAN: SubscriptionPlan = {
  id: 'p-free',
  tier: 'FREE',
  name: 'Free',
  priceMonthly: 0,
  currency: 'AZN',
  entitlements: {
    maxActiveApplications: 3,
    maxFavorites: 20,
    featuredProfile: false,
    analytics: false,
    prioritySupport: false,
  },
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const PRO_PLAN: SubscriptionPlan = {
  ...FREE_PLAN,
  id: 'p-pro',
  tier: 'PRO',
  name: 'Pro',
  priceMonthly: 9.9,
  entitlements: {
    maxActiveApplications: 50,
    maxFavorites: 500,
    featuredProfile: true,
    analytics: true,
    prioritySupport: true,
  },
};

const ACTIVE_SUB: Subscription = {
  id: 's1',
  tier: 'PRO',
  planName: 'Pro',
  status: 'ACTIVE',
  currentPeriodStart: '2026-07-01T00:00:00.000Z',
  currentPeriodEnd: '2026-08-01T00:00:00.000Z',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const PAYMENT: Payment = {
  id: 'pay1',
  amount: 9.9,
  currency: 'AZN',
  status: 'SUCCEEDED',
  provider: 'stripe',
  providerRef: 'ch_1',
  subscriptionId: 's1',
  createdAt: '2026-07-01T09:00:00.000Z',
  updatedAt: '2026-07-01T09:00:00.000Z',
};

const show = jest.fn();
const subscribe = jest.fn();
const cancel = jest.fn();

function summaryResult(
  overrides: Partial<UseSubscriptionSummaryResult>,
): UseSubscriptionSummaryResult {
  return {
    summary: undefined,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

function plansResult(overrides: Partial<UseSubscriptionPlansResult>): UseSubscriptionPlansResult {
  return {
    plans: [],
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

function paymentsResult(overrides: Partial<UsePaymentsResult>): UsePaymentsResult {
  return {
    payments: [],
    total: 0,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  show.mockClear();
  subscribe.mockReset().mockResolvedValue(undefined);
  cancel.mockReset().mockResolvedValue(undefined);
  mockedUseToast.mockReturnValue({ show, hide: jest.fn() });
  mockedSubscribeHook.mockReturnValue({ subscribe, isSubscribing: false });
  mockedCancelHook.mockReturnValue({ cancel, isCancelling: false });
  mockedPayments.mockReturnValue(paymentsResult({}));
});

describe('SubscriptionScreen (#58)', () => {
  it('shows a loading state while the summary or plans load', async () => {
    mockedSummary.mockReturnValue(summaryResult({ isLoading: true }));
    mockedPlans.mockReturnValue(plansResult({ isLoading: true }));

    await renderWithProviders(<SubscriptionScreen onBack={jest.fn()} />);

    expect(screen.getByText('Loading…')).toBeOnTheScreen();
  });

  it('shows an error state with retry when loading fails', async () => {
    const refetchSummary = jest.fn();
    mockedSummary.mockReturnValue(summaryResult({ isError: true, refetch: refetchSummary }));
    mockedPlans.mockReturnValue(plansResult({ isError: true }));

    await renderWithProviders(<SubscriptionScreen onBack={jest.fn()} />);

    expect(screen.getByText('Couldn’t load plans')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(refetchSummary).toHaveBeenCalledTimes(1);
  });

  it('subscribes to a plan after confirming', async () => {
    mockedSummary.mockReturnValue(
      summaryResult({
        summary: { tier: 'FREE', entitlements: FREE_PLAN.entitlements, subscription: null },
      }),
    );
    mockedPlans.mockReturnValue(plansResult({ plans: [FREE_PLAN, PRO_PLAN] }));

    await renderWithProviders(<SubscriptionScreen onBack={jest.fn()} />);

    // The paid plan offers an upgrade; the free (current) plan does not.
    await fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Pro' }));
    expect(screen.getByText('Subscribe to Pro?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => expect(subscribe).toHaveBeenCalledWith({ tier: 'PRO' }));
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'You’re now on the Pro plan.', type: 'success' }),
    );
  });

  it('cancels an active subscription after confirming and lists payments', async () => {
    mockedSummary.mockReturnValue(
      summaryResult({
        summary: { tier: 'PRO', entitlements: PRO_PLAN.entitlements, subscription: ACTIVE_SUB },
      }),
    );
    mockedPlans.mockReturnValue(plansResult({ plans: [FREE_PLAN, PRO_PLAN] }));
    mockedPayments.mockReturnValue(paymentsResult({ payments: [PAYMENT], total: 1 }));

    await renderWithProviders(<SubscriptionScreen onBack={jest.fn()} />);

    expect(screen.getByText('Payment history')).toBeOnTheScreen();

    // Card action opens the confirmation modal; the modal's confirm is the last one.
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel subscription' }));
    expect(screen.getByText('Cancel subscription?')).toBeOnTheScreen();

    const confirm = screen.getAllByRole('button', { name: 'Cancel subscription' }).at(-1);
    if (!confirm) {
      throw new Error('expected a confirmation button');
    }
    await fireEvent.press(confirm);

    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Subscription canceled.', type: 'success' }),
    );
  });
});
