/**
 * Favorites feature — public barrel (student epic #40, #45).
 *
 * A leaf feature: it exposes the saved-tutors state + a presentational toggle and
 * imports nothing from `tutors`, so the dependency runs one way (`tutors →
 * favorites`). Import from here:
 *   `import { useFavorites, FavoriteButton, type FavoriteTutor } from '@features/favorites';`
 */
export { useFavorites, type UseFavorites } from './hooks/useFavorites';
export { FavoriteButton, type FavoriteButtonProps } from './components/FavoriteButton';
export { clearFavorites } from './store/favorites-store';
export type { FavoriteTutor } from './types';
