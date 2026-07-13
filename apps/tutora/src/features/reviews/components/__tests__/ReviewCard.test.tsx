/**
 * ReviewCard (#44) — author, comment, date, and the anonymous fallback.
 */
import type { Review } from '@features/reviews/types';
import { renderWithProviders, screen } from '@/test-utils';

import { ReviewCard } from '../ReviewCard';

const review: Review = {
  id: 'r1',
  rating: 5,
  comment: 'Great and patient tutor.',
  author: { id: 'a1', name: 'Nigar', avatarUrl: null },
  // Local-time so the rendered day is timezone-independent.
  createdAt: '2026-03-09T10:00:00',
  updatedAt: '2026-03-09T10:00:00',
};

describe('ReviewCard (#44)', () => {
  it('renders the author, comment and date', async () => {
    await renderWithProviders(<ReviewCard review={review} />);

    expect(screen.getByText('Nigar')).toBeOnTheScreen();
    expect(screen.getByText('Great and patient tutor.')).toBeOnTheScreen();
    expect(screen.getByText('9.3.2026')).toBeOnTheScreen();
  });

  it('shows an anonymous label when the author has no name', async () => {
    await renderWithProviders(
      <ReviewCard review={{ ...review, author: { ...review.author, name: null } }} />,
    );

    expect(screen.getByText('Anonymous')).toBeOnTheScreen();
  });
});
