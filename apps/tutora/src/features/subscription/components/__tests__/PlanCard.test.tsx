/**
 * PlanCard (#58) — a plan in the catalogue: name, price, benefits, and either a
 * "current plan" marker or a subscribe action.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import type { SubscriptionPlan } from '@features/subscription/types';
import { PlanCard } from '../PlanCard';

const PRO_PLAN: SubscriptionPlan = {
  id: 'p-pro',
  tier: 'PRO',
  name: 'Pro',
  priceMonthly: 9.9,
  currency: 'AZN',
  entitlements: {
    maxActiveApplications: 50,
    maxFavorites: 500,
    featuredProfile: true,
    analytics: true,
    prioritySupport: true,
  },
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('PlanCard (#58)', () => {
  it('renders the plan name and monthly price', async () => {
    await renderWithProviders(<PlanCard plan={PRO_PLAN} isCurrent={false} />);

    expect(screen.getByText('Pro')).toBeTruthy();
    expect(screen.getByText('9.90 ₼')).toBeTruthy();
  });

  it('marks the current plan and hides the subscribe action', async () => {
    const onSubscribe = jest.fn();
    await renderWithProviders(<PlanCard plan={PRO_PLAN} isCurrent onSubscribe={onSubscribe} />);

    expect(screen.getByText('Current plan')).toBeTruthy();
    expect(screen.queryByText('Upgrade to Pro')).toBeNull();
  });

  it('fires onSubscribe when the subscribe action is pressed', async () => {
    const onSubscribe = jest.fn();
    await renderWithProviders(
      <PlanCard plan={PRO_PLAN} isCurrent={false} onSubscribe={onSubscribe} />,
    );

    await fireEvent.press(screen.getByText('Upgrade to Pro'));
    expect(onSubscribe).toHaveBeenCalledTimes(1);
  });
});
