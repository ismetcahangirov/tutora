/**
 * MyReviewCard (#48) — renders the review and fires edit/delete callbacks.
 */
import type { MyReview } from '@features/reviews/types';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { MyReviewCard } from '../MyReviewCard';

const review: MyReview = {
  id: 'r1',
  rating: 4,
  comment: 'Patient and clear.',
  status: 'PUBLISHED',
  author: { id: 'me', name: 'Nigar', avatarUrl: null },
  createdAt: '2026-03-09T10:00:00',
  updatedAt: '2026-03-09T10:00:00',
};

describe('MyReviewCard (#48)', () => {
  it('renders the comment, status and date', async () => {
    await renderWithProviders(
      <MyReviewCard review={review} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(screen.getByText('Patient and clear.')).toBeOnTheScreen();
    expect(screen.getByText('Published')).toBeOnTheScreen();
    expect(screen.getByText('9.3.2026')).toBeOnTheScreen();
  });

  it('fires edit and delete', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    await renderWithProviders(<MyReviewCard review={review} onEdit={onEdit} onDelete={onDelete} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
