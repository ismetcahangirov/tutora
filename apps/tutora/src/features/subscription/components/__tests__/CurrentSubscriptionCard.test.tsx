/**
 * CurrentSubscriptionCard (#58) — the caller's active subscription: plan, status,
 * period, and a cancel action that only shows while the subscription is in force.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import type { Subscription } from '@features/subscription/types';
import { CurrentSubscriptionCard } from '../CurrentSubscriptionCard';

const ACTIVE: Subscription = {
  id: 's1',
  tier: 'PRO',
  planName: 'Pro',
  status: 'ACTIVE',
  currentPeriodStart: '2026-07-01T00:00:00.000Z',
  currentPeriodEnd: '2026-08-01T00:00:00.000Z',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('CurrentSubscriptionCard (#58)', () => {
  it('shows the plan, active status and a cancel action', async () => {
    const onCancel = jest.fn();
    await renderWithProviders(
      <CurrentSubscriptionCard subscription={ACTIVE} onCancel={onCancel} />,
    );

    expect(screen.getByText('Pro')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText(/Renews/)).toBeTruthy();

    await fireEvent.press(screen.getByText('Cancel subscription'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows access-until and no cancel action once canceled', async () => {
    const onCancel = jest.fn();
    await renderWithProviders(
      <CurrentSubscriptionCard
        subscription={{ ...ACTIVE, status: 'CANCELED' }}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText(/Access until/)).toBeTruthy();
    expect(screen.queryByText('Cancel subscription')).toBeNull();
  });
});
