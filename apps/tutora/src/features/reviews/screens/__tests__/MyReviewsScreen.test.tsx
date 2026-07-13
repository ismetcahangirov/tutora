/**
 * MyReviewsScreen (#48) — renders the caller's reviews, its empty state, and
 * deletes behind a confirmation modal. Hooks + toast are mocked.
 */
import { useToast } from '@/components/ui';
import { useDeleteReview } from '@features/reviews/hooks/useDeleteReview';
import { useMyReviews, type UseMyReviewsResult } from '@features/reviews/hooks/useMyReviews';
import type { MyReview } from '@features/reviews/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils';

import { MyReviewsScreen } from '../MyReviewsScreen';

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  useToast: jest.fn(),
}));
jest.mock('@features/reviews/hooks/useMyReviews', () => ({ useMyReviews: jest.fn() }));
jest.mock('@features/reviews/hooks/useDeleteReview', () => ({ useDeleteReview: jest.fn() }));

const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockedUseMyReviews = useMyReviews as jest.MockedFunction<typeof useMyReviews>;
const mockedUseDelete = useDeleteReview as jest.MockedFunction<typeof useDeleteReview>;

const review: MyReview = {
  id: 'r1',
  rating: 4,
  comment: 'Patient and clear.',
  status: 'PUBLISHED',
  author: { id: 'me', name: 'Nigar', avatarUrl: null },
  createdAt: '2026-03-09T10:00:00',
  updatedAt: '2026-03-09T10:00:00',
};

const show = jest.fn();
const remove = jest.fn();

function myReviewsResult(overrides: Partial<UseMyReviewsResult>): UseMyReviewsResult {
  return {
    reviews: [],
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
  remove.mockReset().mockResolvedValue(undefined);
  mockedUseToast.mockReturnValue({ show, hide: jest.fn() });
  mockedUseDelete.mockReturnValue({ remove, isDeleting: false });
});

describe('MyReviewsScreen (#48)', () => {
  it('shows the empty state with no reviews', async () => {
    mockedUseMyReviews.mockReturnValue(myReviewsResult({}));

    await renderWithProviders(<MyReviewsScreen onBack={jest.fn()} onEditReview={jest.fn()} />);

    expect(screen.getByText('You haven’t written any reviews yet.')).toBeOnTheScreen();
  });

  it('renders reviews and opens the composer to edit', async () => {
    mockedUseMyReviews.mockReturnValue(myReviewsResult({ reviews: [review], total: 1 }));
    const onEditReview = jest.fn();

    await renderWithProviders(<MyReviewsScreen onBack={jest.fn()} onEditReview={onEditReview} />);

    expect(screen.getByText('Patient and clear.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    expect(onEditReview).toHaveBeenCalledWith(review);
  });

  it('deletes a review after confirming', async () => {
    mockedUseMyReviews.mockReturnValue(myReviewsResult({ reviews: [review], total: 1 }));

    await renderWithProviders(<MyReviewsScreen onBack={jest.fn()} onEditReview={jest.fn()} />);

    // Card action opens the confirmation modal.
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete review?')).toBeOnTheScreen();

    // Two "Delete" buttons now exist (card + modal); confirm with the modal's.
    const confirmButton = screen.getAllByRole('button', { name: 'Delete' }).at(-1);
    if (!confirmButton) {
      throw new Error('expected a confirmation button');
    }
    await fireEvent.press(confirmButton);

    await waitFor(() => expect(remove).toHaveBeenCalledWith('r1'));
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Review deleted.', type: 'success' }),
    );
  });
});
