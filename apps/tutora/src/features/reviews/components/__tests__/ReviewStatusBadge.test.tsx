/**
 * ReviewStatusBadge (#48) — shows the localized moderation status.
 */
import { renderWithProviders, screen } from '@/test-utils';

import { ReviewStatusBadge } from '../ReviewStatusBadge';

describe('ReviewStatusBadge (#48)', () => {
  it('labels a published review', async () => {
    await renderWithProviders(<ReviewStatusBadge status="PUBLISHED" />);
    expect(screen.getByText('Published')).toBeOnTheScreen();
  });

  it('labels a hidden review', async () => {
    await renderWithProviders(<ReviewStatusBadge status="HIDDEN" />);
    expect(screen.getByText('Hidden')).toBeOnTheScreen();
  });
});
