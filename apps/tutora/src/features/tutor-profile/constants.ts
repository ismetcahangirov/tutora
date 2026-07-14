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
  certificates: '/api/v1/tutors/me/certificates',
  certificateById: (certificateId: string) => `/api/v1/tutors/me/certificates/${certificateId}`,
} as const;

/** Shared media endpoint for signed uploads (#37), appended to `EXPO_PUBLIC_API_URL`. */
export const MEDIA_ENDPOINTS = {
  uploads: '/api/v1/media/uploads',
} as const;

/** Selectable lesson formats, in display order. Mirrors the public feature. */
export const LESSON_FORMATS: LessonFormat[] = ['ONLINE', 'AT_STUDENT_HOME', 'AT_TUTOR_PLACE'];

/**
 * Accepted certificate file types and size ceiling — mirror the backend
 * `UPLOAD_SPECS[CERTIFICATE]` (#37) so an unsupported or oversized file is rejected
 * on-device before a signed upload URL is ever requested.
 */
export const CERTIFICATE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

/** Hard size ceiling for a certificate upload, matching the backend policy (10 MB). */
export const CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024;

/** Certificate field bounds — kept in lockstep with the backend `CreateCertificateDto`. */
export const CERTIFICATE_TITLE_MAX_LENGTH = 200;
export const CERTIFICATE_ISSUED_BY_MAX_LENGTH = 200;

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
