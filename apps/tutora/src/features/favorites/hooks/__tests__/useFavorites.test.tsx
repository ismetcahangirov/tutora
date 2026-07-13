/**
 * useFavorites (#45) — reactive access to the store: toggling updates `favorites`,
 * `count`, and `isFavorite` across renders.
 */
import { act, renderHook } from '@testing-library/react-native';

import { clearFavorites } from '@features/favorites/store/favorites-store';
import type { FavoriteTutor } from '@features/favorites/types';

import { useFavorites } from '../useFavorites';

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

describe('useFavorites (#45)', () => {
  it('starts empty', async () => {
    const { result } = await renderHook(() => useFavorites());
    expect(result.current.count).toBe(0);
    expect(result.current.isFavorite('t1')).toBe(false);
  });

  it('reflects a toggle immediately', async () => {
    const { result } = await renderHook(() => useFavorites());

    await act(async () => result.current.toggle(tutor));
    expect(result.current.count).toBe(1);
    expect(result.current.isFavorite('t1')).toBe(true);
    expect(result.current.favorites[0]?.id).toBe('t1');

    await act(async () => result.current.toggle(tutor));
    expect(result.current.count).toBe(0);
    expect(result.current.isFavorite('t1')).toBe(false);
  });

  it('removes a favorite by id', async () => {
    const { result } = await renderHook(() => useFavorites());

    await act(async () => result.current.toggle(tutor));
    await act(async () => result.current.remove('t1'));

    expect(result.current.count).toBe(0);
  });
});
