/**
 * saved-searches store (#49) — save/remove with the cap, id + timestamp
 * generation, newest-first order, by-id lookup, subscriber notifications, and the
 * stable-snapshot contract. MMKV is stubbed globally; `clearSavedSearches` resets
 * state between tests.
 */
import { SAVED_SEARCH_LIMIT } from '@features/saved-searches/constants';
import type { NewSavedSearch } from '@features/saved-searches/types';
import {
  addSavedSearch,
  clearSavedSearches,
  getSavedSearchById,
  getSavedSearchesSnapshot,
  isSavedSearchesFull,
  removeSavedSearch,
  subscribe,
} from '../saved-searches-store';

const input = (name: string): NewSavedSearch => ({
  name,
  query: name,
  selection: { subject: ['s1'], format: ['ONLINE'] },
});

beforeEach(() => clearSavedSearches());

describe('saved-searches store (#49)', () => {
  it('saves a search with a generated id + timestamp, newest-first', () => {
    const first = addSavedSearch(input('Math'));
    const second = addSavedSearch(input('Physics'));

    expect(first?.id).toBeTruthy();
    expect(first?.createdAt).toBeTruthy();
    expect(getSavedSearchesSnapshot().map((s) => s.name)).toEqual(['Physics', 'Math']);
    expect(first?.id).not.toBe(second?.id);
  });

  it('preserves the query and selection it was given', () => {
    const saved = addSavedSearch(input('Math'));
    expect(saved?.query).toBe('Math');
    expect(saved?.selection).toEqual({ subject: ['s1'], format: ['ONLINE'] });
  });

  it('looks a search up by id', () => {
    const saved = addSavedSearch(input('Math'));
    expect(getSavedSearchById(saved?.id ?? '')?.name).toBe('Math');
    expect(getSavedSearchById('missing')).toBeUndefined();
  });

  it('rejects saves past the limit and reports full', () => {
    for (let i = 0; i < SAVED_SEARCH_LIMIT; i += 1) {
      expect(addSavedSearch(input(`s${i}`))).not.toBeNull();
    }
    expect(isSavedSearchesFull()).toBe(true);
    expect(addSavedSearch(input('overflow'))).toBeNull();
    expect(getSavedSearchesSnapshot()).toHaveLength(SAVED_SEARCH_LIMIT);
  });

  it('removes a saved search by id', () => {
    const saved = addSavedSearch(input('Math'));
    removeSavedSearch(saved?.id ?? '');
    expect(getSavedSearchesSnapshot()).toHaveLength(0);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = subscribe(listener);

    addSavedSearch(input('Math'));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    clearSavedSearches();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns a stable snapshot reference between writes', () => {
    const before = getSavedSearchesSnapshot();
    expect(getSavedSearchesSnapshot()).toBe(before);

    addSavedSearch(input('Math'));
    expect(getSavedSearchesSnapshot()).not.toBe(before);
  });
});
