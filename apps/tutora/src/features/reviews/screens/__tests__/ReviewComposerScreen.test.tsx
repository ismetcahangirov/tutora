/**
 * ReviewComposerScreen (#48) — create submits a new review, edit patches an
 * existing one; both toast and navigate back on success. Hooks + toast are mocked.
 */
import { useToast } from '@/components/ui';
import { useSubmitReview } from '@features/reviews/hooks/useSubmitReview';
import { useUpdateReview } from '@features/reviews/hooks/useUpdateReview';
import type { MyReview } from '@features/reviews/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils';

import { ReviewComposerScreen } from '../ReviewComposerScreen';

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  useToast: jest.fn(),
}));
jest.mock('@features/reviews/hooks/useSubmitReview', () => ({ useSubmitReview: jest.fn() }));
jest.mock('@features/reviews/hooks/useUpdateReview', () => ({ useUpdateReview: jest.fn() }));

const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockedUseSubmit = useSubmitReview as jest.MockedFunction<typeof useSubmitReview>;
const mockedUseUpdate = useUpdateReview as jest.MockedFunction<typeof useUpdateReview>;

const created: MyReview = {
  id: 'r1',
  rating: 5,
  comment: 'Great',
  status: 'PUBLISHED',
  author: { id: 'me', name: 'Nigar', avatarUrl: null },
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
};

const show = jest.fn();
const submit = jest.fn();
const update = jest.fn();

beforeEach(() => {
  show.mockClear();
  submit.mockReset().mockResolvedValue(created);
  update.mockReset().mockResolvedValue(created);
  mockedUseToast.mockReturnValue({ show, hide: jest.fn() });
  mockedUseSubmit.mockReturnValue({ submit, isSubmitting: false });
  mockedUseUpdate.mockReturnValue({ update, isUpdating: false });
});

describe('ReviewComposerScreen (#48)', () => {
  it('submits a new review for the application and navigates back', async () => {
    const onDone = jest.fn();
    await renderWithProviders(
      <ReviewComposerScreen
        mode="create"
        applicationId="app-1"
        tutorName="Aygün"
        onDone={onDone}
      />,
    );

    await fireEvent.press(screen.getByTestId('rating-star-5'));
    await fireEvent.press(screen.getByRole('button', { name: 'Submit review' }));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        applicationId: 'app-1',
        rating: 5,
        comment: undefined,
      }),
    );
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Review submitted. Thanks!', type: 'success' }),
    );
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it('does not submit a create with no application and toasts an error', async () => {
    const onDone = jest.fn();
    await renderWithProviders(<ReviewComposerScreen mode="create" onDone={onDone} />);

    await fireEvent.press(screen.getByTestId('rating-star-4'));
    await fireEvent.press(screen.getByRole('button', { name: 'Submit review' }));

    expect(submit).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('patches an existing review from the edit flow', async () => {
    const onDone = jest.fn();
    await renderWithProviders(
      <ReviewComposerScreen
        mode="edit"
        reviewId="r1"
        initialRating={3}
        initialComment="Was good"
        onDone={onDone}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('r1', { rating: 3, comment: 'Was good' }),
    );
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });
});
