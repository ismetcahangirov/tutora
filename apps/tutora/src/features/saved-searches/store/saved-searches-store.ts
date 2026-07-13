/**
 * Saved-searches store — MMKV-backed, external-store shape (epic #40, #49).
 *
 * Saved searches are persisted client state (they belong to the device/session,
 * not the server), so they live in the same tiny synchronous `useSyncExternalStore`
 * store the favorites/comparison features use: `subscribe` + a `getSnapshot` that
 * returns a *stable* reference between writes. The list is ordered newest-first.
 * The store owns id + timestamp generation so callers pass only the meaningful
 * fields, and it enforces the `SAVED_SEARCH_LIMIT` cap by rejecting further saves.
 */
import { createMMKV, type MMKV } from 'react-native-mmkv';

import { SAVED_SEARCH_LIMIT, SAVED_SEARCH_STORAGE_KEY } from '../constants';
import type { NewSavedSearch, SavedSearch } from '../types';

const storage: MMKV = createMMKV({ id: 'tutora' });
const listeners = new Set<() => void>();

// Monotonic suffix so two saves in the same millisecond still get distinct ids.
let sequence = 0;

// Stable in-memory snapshot; hydrated lazily from MMKV, replaced only on write.
let cache: SavedSearch[] | null = null;

function read(): SavedSearch[] {
  if (cache === null) {
    const raw = storage.getString(SAVED_SEARCH_STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SavedSearch[]) : [];
  }
  return cache;
}

function write(next: SavedSearch[]): void {
  cache = next;
  storage.set(SAVED_SEARCH_STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

/** Register a change listener; returns an unsubscribe. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current saved searches — a stable reference between writes. */
export function getSavedSearchesSnapshot(): SavedSearch[] {
  return read();
}

/** Non-reactive lookup, e.g. for a route resolving a preset before rendering. */
export function getSavedSearchById(id: string): SavedSearch | undefined {
  return read().find((search) => search.id === id);
}

export function isSavedSearchesFull(): boolean {
  return read().length >= SAVED_SEARCH_LIMIT;
}

/**
 * Persist a new saved search (prepended, newest-first). Returns the created
 * record, or `null` when the limit has been reached so the caller can surface a
 * "limit reached" message rather than silently dropping the save.
 */
export function addSavedSearch(input: NewSavedSearch): SavedSearch | null {
  const current = read();
  if (current.length >= SAVED_SEARCH_LIMIT) {
    return null;
  }
  sequence += 1;
  const search: SavedSearch = {
    id: `${Date.now().toString(36)}-${sequence}`,
    name: input.name,
    query: input.query,
    selection: input.selection,
    createdAt: new Date().toISOString(),
  };
  write([search, ...current]);
  return search;
}

export function removeSavedSearch(id: string): void {
  const current = read();
  if (!current.some((search) => search.id === id)) {
    return;
  }
  write(current.filter((search) => search.id !== id));
}

/** Clear every saved search. Also used to reset state between tests. */
export function clearSavedSearches(): void {
  write([]);
}
