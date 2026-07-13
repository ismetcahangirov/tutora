/**
 * TutorResultsList (#42/#43) — success renders cards and navigates; the error and
 * empty states render their copy and the retry wiring works.
 */
import { clearFavorites } from '@features/favorites';
import { tutorSummary } from '@features/tutors/__tests__/fixtures';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { TutorResultsList } from '../TutorResultsList';

const baseProps = {
  onRetry: jest.fn(),
  onPressTutor: jest.fn(),
  emptyTitle: 'No tutors found',
  errorTitle: 'Something went wrong',
  retryLabel: 'Retry',
};

beforeEach(() => clearFavorites());

describe('TutorResultsList (#43)', () => {
  it('renders a card per tutor and navigates on press', async () => {
    const onPressTutor = jest.fn();
    await renderWithProviders(
      <TutorResultsList
        {...baseProps}
        onPressTutor={onPressTutor}
        tutors={[tutorSummary]}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText('Aygün Məmmədova')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Aygün Məmmədova' }));
    expect(onPressTutor).toHaveBeenCalledWith('tutor-1');
  });

  it('renders the empty state when there are no results', async () => {
    await renderWithProviders(
      <TutorResultsList {...baseProps} tutors={[]} isLoading={false} isError={false} />,
    );

    expect(screen.getByText('No tutors found')).toBeOnTheScreen();
  });

  it('renders the error state with a working retry', async () => {
    const onRetry = jest.fn();
    await renderWithProviders(
      <TutorResultsList {...baseProps} onRetry={onRetry} tutors={[]} isLoading={false} isError />,
    );

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
