/**
 * FavoritesScreen (#45) — renders saved snapshots from the store and its empty
 * state, and navigates to a profile on tap.
 */
import { addFavorite, clearFavorites } from '@features/favorites/store/favorites-store';
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

beforeEach(() => clearFavorites());

describe('FavoritesScreen (#45)', () => {
  it('shows the empty state with no favorites', async () => {
    await renderWithProviders(<FavoritesScreen onPressTutor={jest.fn()} />);
    expect(screen.getByText('No favorites yet')).toBeOnTheScreen();
  });

  it('renders saved tutors and navigates on press', async () => {
    addFavorite(saved);
    const onPressTutor = jest.fn();

    await renderWithProviders(<FavoritesScreen onPressTutor={onPressTutor} />);

    expect(screen.getByText('Aygün Məmmədova')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Aygün Məmmədova' }));
    expect(onPressTutor).toHaveBeenCalledWith('t1');
  });
});
