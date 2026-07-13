/**
 * NotificationsBadge (#50) — renders the unread count, caps at 99+, hides at zero.
 */
import { renderWithProviders, screen } from '@/test-utils';

import { NotificationsBadge } from '../NotificationsBadge';

describe('NotificationsBadge (#50)', () => {
  it('renders the count', async () => {
    await renderWithProviders(<NotificationsBadge count={5} />);
    expect(screen.getByText('5')).toBeOnTheScreen();
  });

  it('caps a large count at 99+', async () => {
    await renderWithProviders(<NotificationsBadge count={250} />);
    expect(screen.getByText('99+')).toBeOnTheScreen();
  });

  it('renders nothing when the count is zero', async () => {
    await renderWithProviders(<NotificationsBadge count={0} />);
    expect(screen.queryByText('0')).toBeNull();
  });
});
