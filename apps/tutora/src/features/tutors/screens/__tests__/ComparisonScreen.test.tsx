/**
 * ComparisonScreen (#46) — renders one column per selected tutor (each fetching
 * its own profile), shows the empty state when the selection is cleared, and
 * removes a tutor from the comparison on the column's ✕.
 */
import { getTutorById } from '@features/tutors/api/tutors.api';
import { addToComparison, clearComparison } from '@features/comparison/store/comparison-store';
import { tutorProfile } from '@features/tutors/__tests__/fixtures';

import { ComparisonScreen } from '../ComparisonScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils';

jest.mock('@features/tutors/api/tutors.api', () => ({
  getTutorById: jest.fn(),
  TutorNotFoundError: class TutorNotFoundError extends Error {},
}));
const mockedGet = getTutorById as jest.MockedFunction<typeof getTutorById>;

beforeEach(() => {
  clearComparison();
  mockedGet.mockReset();
  mockedGet.mockImplementation((id: string) => Promise.resolve({ ...tutorProfile, id }));
});

describe('ComparisonScreen (#46)', () => {
  it('shows the empty state when nothing is selected', async () => {
    await renderWithProviders(<ComparisonScreen onBack={jest.fn()} onPressTutor={jest.fn()} />);
    expect(screen.getByText('Nothing to compare yet')).toBeOnTheScreen();
  });

  it('renders a column per selected tutor with its attributes', async () => {
    addToComparison({ id: 't1', name: 'Aygün', avatarUrl: null });
    addToComparison({ id: 't2', name: 'Rəşad', avatarUrl: null });

    await renderWithProviders(<ComparisonScreen onBack={jest.fn()} onPressTutor={jest.fn()} />);

    await waitFor(() => expect(screen.getByTestId('comparison-column-t1')).toBeOnTheScreen());
    expect(screen.getByTestId('comparison-column-t2')).toBeOnTheScreen();
    // The "Rating" attribute label appears once per loaded column.
    expect(screen.getAllByText('Rating')).toHaveLength(2);
    expect(mockedGet).toHaveBeenCalledWith('t1');
    expect(mockedGet).toHaveBeenCalledWith('t2');
  });

  it('removes a tutor from the comparison on the column ✕', async () => {
    addToComparison({ id: 't1', name: 'Aygün', avatarUrl: null });
    addToComparison({ id: 't2', name: 'Rəşad', avatarUrl: null });

    await renderWithProviders(<ComparisonScreen onBack={jest.fn()} onPressTutor={jest.fn()} />);

    await waitFor(() => expect(screen.getByTestId('comparison-column-t1')).toBeOnTheScreen());

    const [firstRemove] = screen.getAllByRole('button', { name: 'Remove from comparison' });
    if (!firstRemove) throw new Error('expected a remove button');
    await fireEvent.press(firstRemove);
    await waitFor(() => expect(screen.queryByTestId('comparison-column-t1')).toBeNull());
    expect(screen.getByTestId('comparison-column-t2')).toBeOnTheScreen();
  });
});
