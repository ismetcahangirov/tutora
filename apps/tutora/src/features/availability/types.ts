/**
 * Availability feature — API contract types (tutor epic #51, #55; backend #55).
 *
 * The tutor's recurring *weekly* availability: each slot is a window on one
 * weekday, stored as minutes from local midnight (timezone-agnostic wall-clock).
 * These mirror the backend `AvailabilitySlotView` and `SetAvailabilityDto`.
 */

/** Days of the week, matching the backend `Weekday` enum (Monday-first). */
export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

/** A saved availability window — `GET /api/v1/tutors/me/availability`. */
export type AvailabilitySlot = {
  id: string;
  weekday: Weekday;
  /** Minutes from midnight, inclusive start (0–1439). */
  startMinute: number;
  /** Minutes from midnight, exclusive end (1–1440); always `> startMinute`. */
  endMinute: number;
};

/** A window to save — the id is assigned server-side, so it is omitted here. */
export type AvailabilitySlotInput = {
  weekday: Weekday;
  startMinute: number;
  endMinute: number;
};

/** Body of `PUT /api/v1/tutors/me/availability` — replaces the whole week. */
export type SetAvailabilityInput = {
  slots: AvailabilitySlotInput[];
};
