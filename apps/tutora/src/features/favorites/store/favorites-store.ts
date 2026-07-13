/**
 * Favorites store — MMKV-backed, external-store shape (student epic #40, #45).
 *
 * Favorites are persisted client state, not server state, so they live in a tiny
 * synchronous store rather than React Query. The public surface follows the
 * `useSyncExternalStore` contract: `subscribe` + a `getSnapshot` that returns a
 * *stable* reference (the in-memory `cache`) until the next write — re-creating
 * the object on every read would loop React forever. Writes update the cache,
 * persist to MMKV, and notify subscribers.
 *
 * Mirrors the thin-wrapper-over-MMKV idiom used by the i18n layer, so MMKV is
 * mocked in tests via the same jest stub.
 */
import { createMMKV, type MMKV } from 'react-native-mmkv';

import type { FavoriteTutor } from '../types';

/** id → saved snapshot. Object insertion order is newest-first (see `addFavorite`). */
type FavoriteMap = Record<string, FavoriteTutor>;

const STORAGE_KEY = 'favorites.tutors';

const storage: MMKV = createMMKV({ id: 'tutora' });
const listeners = new Set<() => void>();

// Stable in-memory snapshot; hydrated lazily from MMKV, replaced only on write.
let cache: FavoriteMap | null = null;

function read(): FavoriteMap {
  if (cache === null) {
    const raw = storage.getString(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as FavoriteMap) : {};
  }
  return cache;
}

function write(next: FavoriteMap): void {
  cache = next;
  storage.set(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

/** Register a change listener; returns an unsubscribe. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current favorites map — a stable reference between writes. */
export function getFavoritesSnapshot(): FavoriteMap {
  return read();
}

export function isFavorite(id: string): boolean {
  return id in read();
}

/** Save a tutor (newest-first). No-op if already saved. */
export function addFavorite(tutor: FavoriteTutor): void {
  const current = read();
  if (tutor.id in current) {
    return;
  }
  write({ [tutor.id]: tutor, ...current });
}

export function removeFavorite(id: string): void {
  const current = read();
  if (!(id in current)) {
    return;
  }
  const { [id]: _removed, ...rest } = current;
  write(rest);
}

/** Toggle a tutor's saved state. */
export function toggleFavorite(tutor: FavoriteTutor): void {
  if (isFavorite(tutor.id)) {
    removeFavorite(tutor.id);
  } else {
    addFavorite(tutor);
  }
}

/** Clear all favorites. Primarily used to reset state between tests. */
export function clearFavorites(): void {
  write({});
}
