/**
 * Tutor-applications feature — endpoints, keys, defaults (tutor epic #51, #57).
 *
 * User-facing copy (status labels, filter labels) lives in the i18n catalogs under
 * `tutor.applications.*`; this file holds only stable, non-localized constants.
 */
import type { ApplicationStatus } from './types';

/** Authenticated tutor application endpoints, appended to `EXPO_PUBLIC_API_URL`. */
export const APPLICATION_ENDPOINTS = {
  root: '/api/v1/tutor/applications',
  accept: (id: string) => `/api/v1/tutor/applications/${id}/accept`,
  decline: (id: string) => `/api/v1/tutor/applications/${id}/decline`,
  complete: (id: string) => `/api/v1/tutor/applications/${id}/complete`,
} as const;

/** Default page size for the applications list. Matches the backend default. */
export const APPLICATIONS_PAGE_SIZE = 20;

/**
 * The status filters offered in the UI, in display order. `undefined` is the
 * "all" tab; the rest map to the backend `status` query param. Only the statuses
 * a tutor meaningfully triages are surfaced.
 */
export const APPLICATION_FILTERS: (ApplicationStatus | undefined)[] = [
  undefined,
  'PENDING',
  'ACCEPTED',
  'COMPLETED',
  'DECLINED',
];

/** Structured, stable query keys keyed by the active status filter. */
export const applicationKeys = {
  all: ['tutor-applications'] as const,
  list: (status?: ApplicationStatus) => [...applicationKeys.all, 'list', status ?? 'ALL'] as const,
};
