/**
 * useFavorites — reactive access to the saved-tutors store (student epic #40, #45).
 *
 * Subscribes to the external favorites store via `useSyncExternalStore`, so any
 * card, detail header, or the favorites tab re-renders the instant a tutor is
 * saved or removed anywhere in the app. The returned actions are the stable store
 * functions; `isFavorite` closes over the current snapshot so it stays in sync.
 */
import { useMemo, useSyncExternalStore } from 'react';

import {
  getFavoritesSnapshot,
  removeFavorite,
  subscribe,
  toggleFavorite,
} from '../store/favorites-store';
import type { FavoriteTutor } from '../types';

export type UseFavorites = {
  /** Saved tutors, newest first. */
  favorites: FavoriteTutor[];
  count: number;
  isFavorite: (id: string) => boolean;
  toggle: (tutor: FavoriteTutor) => void;
  remove: (id: string) => void;
};

export function useFavorites(): UseFavorites {
  const map = useSyncExternalStore(subscribe, getFavoritesSnapshot, getFavoritesSnapshot);

  const favorites = useMemo(() => Object.values(map), [map]);

  return {
    favorites,
    count: favorites.length,
    isFavorite: (id) => id in map,
    toggle: toggleFavorite,
    remove: removeFavorite,
  };
}
