/**
 * StatusBadge (#58) — a generic outlined pill that renders its label in the given
 * theme tone.
 */
import { renderWithProviders, screen } from '@/test-utils';

import { StatusBadge } from '../StatusBadge';

describe('StatusBadge (#58)', () => {
  it('renders its label', async () => {
    await renderWithProviders(<StatusBadge label="Active" tone="success" />);

    expect(screen.getByText('Active')).toBeTruthy();
  });
});
