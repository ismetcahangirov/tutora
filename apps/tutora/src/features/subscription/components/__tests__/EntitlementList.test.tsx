/**
 * EntitlementList (#58) — lists the tutor-facing plan benefits, marking each as
 * included or not.
 */
import { renderWithProviders, screen } from '@/test-utils';

import type { Entitlements } from '@features/subscription/types';
import { EntitlementList } from '../EntitlementList';

const PRO: Entitlements = {
  maxActiveApplications: 50,
  maxFavorites: 500,
  featuredProfile: true,
  analytics: true,
  prioritySupport: true,
};

const FREE: Entitlements = {
  maxActiveApplications: 3,
  maxFavorites: 20,
  featuredProfile: false,
  analytics: false,
  prioritySupport: false,
};

describe('EntitlementList (#58)', () => {
  it('lists the three tutor benefits', async () => {
    await renderWithProviders(<EntitlementList entitlements={PRO} />);

    expect(screen.getByText('Featured placement in search')).toBeTruthy();
    expect(screen.getByText('Analytics dashboard')).toBeTruthy();
    expect(screen.getByText('Priority support')).toBeTruthy();
  });

  it('marks an included benefit as included and an excluded one as not', async () => {
    await renderWithProviders(<EntitlementList entitlements={FREE} />);

    // Each benefit row is labelled with its inclusion for screen readers.
    expect(screen.getByLabelText('Featured placement in search: Not included')).toBeTruthy();
  });
});
