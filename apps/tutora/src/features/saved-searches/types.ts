/**
 * Saved-searches feature — types (student epic #40, #49).
 *
 * A saved search is a named snapshot of a tutor search: the free-text query plus
 * the chip selection (section key → selected values). The selection is typed as a
 * plain `Record<string, string[]>` — structurally identical to the UI kit's
 * `FilterSelection` — so this data feature stays decoupled from the component
 * layer while remaining assignable at the search-screen boundary.
 */
export type SavedFilterSelection = Record<string, string[]>;

export type SavedSearch = {
  id: string;
  name: string;
  query: string;
  selection: SavedFilterSelection;
  /** ISO timestamp; the list is ordered newest-first. */
  createdAt: string;
};

/** The fields a caller supplies when saving; `id`/`createdAt` are assigned by the store. */
export type NewSavedSearch = {
  name: string;
  query: string;
  selection: SavedFilterSelection;
};
