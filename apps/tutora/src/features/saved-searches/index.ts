/**
 * Saved-searches feature — public barrel (student epic #40, #49).
 *
 * A leaf feature owning the persisted "saved tutor searches" state. The Search
 * tab writes to it (save the current query + filters); the Profile tab reads it
 * (list, apply, delete); the Search route resolves a preset by id when applying.
 *   `import { useSavedSearches, getSavedSearchById } from '@features/saved-searches';`
 */
export { useSavedSearches, type UseSavedSearches } from './hooks/useSavedSearches';
export { getSavedSearchById, clearSavedSearches } from './store/saved-searches-store';
export { SAVED_SEARCH_LIMIT } from './constants';
export type { SavedSearch, SavedFilterSelection, NewSavedSearch } from './types';
