/**
 * Availability feature — endpoints, query keys, and the editor grid (tutor epic
 * #51, #55; backend #55).
 *
 * User-facing copy lives in the i18n catalogs under `tutor.availability.*`; this
 * file holds only stable, non-localized constants. The editor exposes the week as
 * fixed hourly blocks — the backend stores arbitrary minutes, so the grid can
 * widen or get finer later without a migration.
 */
import type { Weekday } from './types';

/** Tutor-scoped availability endpoint, appended to `EXPO_PUBLIC_API_URL`. */
export const AVAILABILITY_ENDPOINTS = {
  /** The caller's weekly availability (GET reads, PUT replaces). */
  availability: '/api/v1/tutors/me/availability',
} as const;

/** Weekdays in display order (Monday-first), matching the backend enum order. */
export const WEEKDAYS: readonly Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** Minutes in a day — the exclusive upper bound of any window (midnight). */
export const MINUTES_IN_DAY = 24 * 60;

/** First selectable block start (06:00) in the day editor. */
export const DAY_START_MINUTE = 6 * 60;
/** Last selectable block end (23:00) in the day editor. */
export const DAY_END_MINUTE = 23 * 60;
/** Editor granularity — one-hour blocks. */
export const SLOT_STEP_MINUTES = 60;

/**
 * Structured, stable query keys. Availability is a single per-user resource, so a
 * write invalidates the whole `all` prefix and the list re-reads from source.
 */
export const availabilityKeys = {
  all: ['availability'] as const,
  list: () => [...availabilityKeys.all, 'list'] as const,
};
