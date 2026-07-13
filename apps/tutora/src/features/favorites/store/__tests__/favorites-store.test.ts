/**
 * favorites store (#45) — add/remove/toggle, subscriber notifications, and the
 * stable-snapshot contract `useSyncExternalStore` relies on. MMKV is stubbed by
 * the global jest setup; `clearFavorites` resets state between tests.
 */
import type { FavoriteTutor } from '@features/favorites/types';

import {
  addFavorite,
  clearFavorites,
  getFavoritesSnapshot,
  isFavorite,
  removeFavorite,
  subscribe,
  toggleFavorite,
} from '../favorites-store';

const tutor: FavoriteTutor = {
  id: 't1',
  name: 'Aygün',
  avatarUrl: null,
  ratingAvg: 4.5,
  ratingCount: 10,
  hourlyRate: 20,
  currency: 'AZN',
  isVerified: true,
  subjectNames: ['Mathematics'],
  formats: ['ONLINE'],
};

beforeEach(() => clearFavorites());

describe('favorites store (#45)', () => {
  it('saves a tutor and reports it as a favorite', () => {
    addFavorite(tutor);
    expect(isFavorite('t1')).toBe(true);
    expect(getFavoritesSnapshot()).toHaveProperty('t1');
  });

  it('does not duplicate an already-saved tutor', () => {
    addFavorite(tutor);
    addFavorite({ ...tutor, name: 'Changed' });
    expect(Object.keys(getFavoritesSnapshot())).toHaveLength(1);
    // The original snapshot is kept (add is a no-op when present).
    expect(getFavoritesSnapshot().t1?.name).toBe('Aygün');
  });

  it('removes a saved tutor', () => {
    addFavorite(tutor);
    removeFavorite('t1');
    expect(isFavorite('t1')).toBe(false);
  });

  it('toggles a tutor on and off', () => {
    toggleFavorite(tutor);
    expect(isFavorite('t1')).toBe(true);
    toggleFavorite(tutor);
    expect(isFavorite('t1')).toBe(false);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = subscribe(listener);

    addFavorite(tutor);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    removeFavorite('t1');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns a stable snapshot reference between writes', () => {
    const before = getFavoritesSnapshot();
    expect(getFavoritesSnapshot()).toBe(before);

    addFavorite(tutor);
    expect(getFavoritesSnapshot()).not.toBe(before);
  });
});
