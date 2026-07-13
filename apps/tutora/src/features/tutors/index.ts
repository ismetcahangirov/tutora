/**
 * Tutors feature — public barrel (student epic #40).
 *
 * The tutor discovery + profile surface: Home, Search, Detail, and the Favorites
 * list, plus the underlying data hooks and card component. Import screens from
 * here into the route files:
 *   `import { HomeScreen, TutorDetailScreen } from '@features/tutors';`
 */
export { HomeScreen, type HomeScreenProps } from './screens/HomeScreen';
export { TutorSearchScreen, type TutorSearchScreenProps } from './screens/TutorSearchScreen';
export { TutorDetailScreen, type TutorDetailScreenProps } from './screens/TutorDetailScreen';
export { FavoritesScreen, type FavoritesScreenProps } from './screens/FavoritesScreen';

export { TutorCard, type TutorCardProps } from './components/TutorCard';

export { useTutorSearch, type UseTutorSearchResult } from './hooks/useTutorSearch';
export { useFeaturedTutors, type UseFeaturedTutorsResult } from './hooks/useFeaturedTutors';
export { useTutorDetail } from './hooks/useTutorDetail';

export { searchTutors, getTutorById, TutorNotFoundError } from './api/tutors.api';
export { toTutorCardData, toFavoriteTutor, type TutorCardData } from './mappers';

export type {
  TutorSummary,
  TutorProfile,
  TutorSearchParams,
  TutorSort,
  LessonFormat,
  VerificationStatus,
  TutorCertificate,
  Paginated,
} from './types';
