/**
 * useSavedSearches — reactive access to the saved-search list (epic #40, #49).
 *
 * Subscribes to the external store via `useSyncExternalStore`, so the Search tab's
 * save action and the Profile tab's saved-search list stay in sync. Actions are
 * the stable store functions; `save` returns the created record (or `null` when
 * the cap is hit) so the caller can toast the outcome.
 */
import { useSyncExternalStore } from 'react';

import { SAVED_SEARCH_LIMIT } from '../constants';
import {
  addSavedSearch,
  clearSavedSearches,
  getSavedSearchesSnapshot,
  isSavedSearchesFull,
  removeSavedSearch,
  subscribe,
} from '../store/saved-searches-store';
import type { NewSavedSearch, SavedSearch } from '../types';

export type UseSavedSearches = {
  /** Saved searches, newest first. */
  searches: SavedSearch[];
  count: number;
  limit: number;
  isFull: boolean;
  /** Persist a new search; returns the record, or `null` if the cap was reached. */
  save: (input: NewSavedSearch) => SavedSearch | null;
  remove: (id: string) => void;
  clear: () => void;
};

export function useSavedSearches(): UseSavedSearches {
  const searches = useSyncExternalStore(
    subscribe,
    getSavedSearchesSnapshot,
    getSavedSearchesSnapshot,
  );

  return {
    searches,
    count: searches.length,
    limit: SAVED_SEARCH_LIMIT,
    isFull: isSavedSearchesFull(),
    save: addSavedSearch,
    remove: removeSavedSearch,
    clear: clearSavedSearches,
  };
}
