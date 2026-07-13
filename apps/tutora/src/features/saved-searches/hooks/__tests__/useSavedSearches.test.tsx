/**
 * useSavedSearches (#49) — reactive access: saving updates `searches`/`count`,
 * removing prunes the list, and the cap surfaces via a `null` save result.
 */
import { act, renderHook } from '@testing-library/react-native';

import { clearSavedSearches } from '@features/saved-searches/store/saved-searches-store';
import { SAVED_SEARCH_LIMIT } from '@features/saved-searches/constants';
import { useSavedSearches } from '../useSavedSearches';

beforeEach(() => clearSavedSearches());

describe('useSavedSearches (#49)', () => {
  it('starts empty', async () => {
    const { result } = await renderHook(() => useSavedSearches());
    expect(result.current.count).toBe(0);
    expect(result.current.isFull).toBe(false);
  });

  it('reflects a save and a remove', async () => {
    const { result } = await renderHook(() => useSavedSearches());

    let id = '';
    await act(async () => {
      id = result.current.save({ name: 'Math', query: 'math', selection: {} })?.id ?? '';
    });
    expect(result.current.count).toBe(1);
    expect(result.current.searches[0]?.name).toBe('Math');

    await act(async () => result.current.remove(id));
    expect(result.current.count).toBe(0);
  });

  it('returns null once the limit is reached', async () => {
    const { result } = await renderHook(() => useSavedSearches());

    await act(async () => {
      for (let i = 0; i < SAVED_SEARCH_LIMIT; i += 1) {
        result.current.save({ name: `s${i}`, query: '', selection: {} });
      }
    });
    expect(result.current.isFull).toBe(true);

    let overflow: unknown;
    await act(async () => {
      overflow = result.current.save({ name: 'overflow', query: '', selection: {} });
    });
    expect(overflow).toBeNull();
    expect(result.current.count).toBe(SAVED_SEARCH_LIMIT);
  });
});
