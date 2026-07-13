/**
 * FavoritesScreen (#45, #46) — renders saved snapshots from the store and its
 * empty state, navigates to a profile on tap, and drives comparison selection:
 * picking two favorites reveals the compare tray and opens the comparison.
 */
import { addFavorite, clearFavorites } from '@features/favorites/store/favorites-store';
import { clearComparison } from '@features/comparison/store/comparison-store';
import type { FavoriteTutor } from '@features/favorites';

import { FavoritesScreen } from '../FavoritesScreen';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

const saved: FavoriteTutor = {
  id: 't1',
  name: 'Aygün Məmmədova',
  avatarUrl: null,
  ratingAvg: 4.8,
  ratingCount: 42,
  hourlyRate: 30,
  currency: 'AZN',
  isVerified: true,
  subjectNames: ['Mathematics'],
  formats: ['ONLINE'],
};

const other: FavoriteTutor = { ...saved, id: 't2', name: 'Rəşad Əliyev' };

beforeEach(() => {
  clearFavorites();
  clearComparison();
});

describe('FavoritesScreen (#45, #46)', () => {
  it('shows the empty state with no favorites', async () => {
    await renderWithProviders(<FavoritesScreen onPressTutor={jest.fn()} onCompare={jest.fn()} />);
    expect(screen.getByText('No favorites yet')).toBeOnTheScreen();
  });

  it('renders saved tutors and navigates on press', async () => {
    addFavorite(saved);
    const onPressTutor = jest.fn();

    await renderWithProviders(
      <FavoritesScreen onPressTutor={onPressTutor} onCompare={jest.fn()} />,
    );

    expect(screen.getByText('Aygün Məmmədova')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Aygün Məmmədova' }));
    expect(onPressTutor).toHaveBeenCalledWith('t1');
  });

  it('reveals the compare tray and opens the comparison after selecting two', async () => {
    addFavorite(saved);
    addFavorite(other);
    const onCompare = jest.fn();

    await renderWithProviders(<FavoritesScreen onPressTutor={jest.fn()} onCompare={onCompare} />);

    const [addFirst, addSecond] = screen.getAllByRole('button', { name: 'Add to compare' });
    if (!addFirst || !addSecond) throw new Error('expected two compare toggles');

    await fireEvent.press(addFirst);
    // One selected → tray visible but comparison not yet possible.
    expect(screen.getByText('Pick at least one more to compare')).toBeOnTheScreen();

    await fireEvent.press(addSecond);
    await fireEvent.press(screen.getByTestId('comparison-bar-compare'));
    expect(onCompare).toHaveBeenCalledTimes(1);
  });
});
