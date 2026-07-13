/**
 * Tutors feature — endpoints, query keys, defaults (student epic #40).
 *
 * User-facing copy (format labels, sort labels) lives in the i18n catalogs under
 * `tutors.*`; this file holds only stable, non-localized constants.
 */
import type { LessonFormat, TutorSearchParams, TutorSort } from './types';

/** Public tutor endpoints, appended to `EXPO_PUBLIC_API_URL`. */
export const TUTOR_ENDPOINTS = {
  search: '/api/v1/search/tutors',
  /** Detail: append `/:id`. */
  byId: (id: string) => `/api/v1/tutors/${id}`,
} as const;

/** Default page size for search + featured lists. Matches the backend default. */
export const DEFAULT_PAGE_SIZE = 20;

/** How many top-rated tutors the home screen previews. */
export const FEATURED_LIMIT = 6;

/** How many subject quick-filter chips the home screen shows. */
export const HOME_SUBJECT_LIMIT = 8;

/** Selectable lesson formats, in display order. */
export const LESSON_FORMATS: LessonFormat[] = ['ONLINE', 'AT_STUDENT_HOME', 'AT_TUTOR_PLACE'];

/** Selectable sort orders, in display order (default first). */
export const TUTOR_SORTS: TutorSort[] = ['rating', 'price_asc', 'price_desc', 'newest'];

/**
 * Structured query keys. Search keys embed the normalized filter object so each
 * distinct filter combination caches independently and invalidates precisely.
 */
export const tutorKeys = {
  all: ['tutors'] as const,
  lists: () => [...tutorKeys.all, 'list'] as const,
  search: (params: TutorSearchParams) => [...tutorKeys.lists(), params] as const,
  featured: () => [...tutorKeys.all, 'featured'] as const,
  details: () => [...tutorKeys.all, 'detail'] as const,
  detail: (id: string) => [...tutorKeys.details(), id] as const,
};
