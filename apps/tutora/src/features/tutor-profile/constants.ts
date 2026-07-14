/**
 * Tutor-profile feature — endpoints, query keys, and validation bounds
 * (tutor epic #51, #53, #56).
 *
 * User-facing copy lives in the i18n catalogs under `tutor.profile.*`; this file
 * holds only stable, non-localized constants. The field bounds mirror the backend
 * `UpdateTutorProfileDto` so the client can reject a doomed request before it is
 * sent (and render the same limits in helper text).
 */
import type { LessonFormat } from '@features/tutors';

/** Authenticated tutor self-management endpoints, appended to `EXPO_PUBLIC_API_URL`. */
export const TUTOR_PROFILE_ENDPOINTS = {
  me: '/api/v1/tutors/me',
  verification: '/api/v1/tutors/me/verification',
  subjects: '/api/v1/tutors/me/subjects',
  subjectById: (subjectId: string) => `/api/v1/tutors/me/subjects/${subjectId}`,
  districts: '/api/v1/tutors/me/districts',
  districtById: (districtId: string) => `/api/v1/tutors/me/districts/${districtId}`,
  languages: '/api/v1/tutors/me/languages',
  languageById: (languageId: string) => `/api/v1/tutors/me/languages/${languageId}`,
} as const;

/** Selectable lesson formats, in display order. Mirrors the public feature. */
export const LESSON_FORMATS: LessonFormat[] = ['ONLINE', 'AT_STUDENT_HOME', 'AT_TUTOR_PLACE'];

/** Default currency for a fresh profile. Matches the backend default. */
export const DEFAULT_CURRENCY = 'AZN';

/** Field bounds — kept in lockstep with the backend `UpdateTutorProfileDto`. */
export const BIO_MAX_LENGTH = 2000;
export const EXPERIENCE_MIN_YEARS = 0;
export const EXPERIENCE_MAX_YEARS = 80;
export const HOURLY_RATE_MIN = 0;
export const HOURLY_RATE_MAX = 100_000;

/**
 * Structured, stable query key. There is a single per-user resource (`me`), so one
 * key covers the whole feature; mutations write the fresh profile straight back to
 * it rather than triggering a refetch.
 */
export const tutorProfileKeys = {
  all: ['tutor-profile'] as const,
  me: () => [...tutorProfileKeys.all, 'me'] as const,
};
