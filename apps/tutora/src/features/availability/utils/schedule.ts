/**
 * Availability scheduling helpers — pure functions shared by the screen, the day
 * editor, and their tests (#55).
 *
 * The editor models a day as fixed hourly blocks; these helpers translate between
 * that block selection and the backend's `{ startMinute, endMinute }` windows, and
 * format minutes-from-midnight for display. Keeping the logic here (not in
 * components) makes it deterministic and unit-testable.
 */
import type { AvailabilitySlot, AvailabilitySlotInput, Weekday } from '../types';

/** A minutes-from-midnight range, shared by saved slots and draft blocks. */
type MinuteRange = { startMinute: number; endMinute: number };

/** Formats minutes-from-midnight as a zero-padded 24-hour `HH:MM`. */
export function formatMinutes(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Formats a window as `HH:MM – HH:MM` (en dash). */
export function formatSlotRange(slot: MinuteRange): string {
  return `${formatMinutes(slot.startMinute)} – ${formatMinutes(slot.endMinute)}`;
}

/** The block start minutes for a day, e.g. `[360, 420, …]` for 06:00-hourly. */
export function buildDayBlocks(start: number, end: number, step: number): number[] {
  const blocks: number[] = [];
  for (let minute = start; minute + step <= end; minute += step) {
    blocks.push(minute);
  }
  return blocks;
}

/** Block starts that overlap any of the day's saved windows — the initial selection. */
export function slotsToSelectedStarts(
  slots: readonly MinuteRange[],
  blocks: readonly number[],
  step: number,
): number[] {
  return blocks.filter((block) =>
    slots.some((slot) => block < slot.endMinute && block + step > slot.startMinute),
  );
}

/** Merges selected block starts into the fewest contiguous windows. */
export function mergeStartsToSlots(starts: readonly number[], step: number): MinuteRange[] {
  const sorted = [...new Set(starts)].sort((a, b) => a - b);
  const slots: MinuteRange[] = [];
  for (const start of sorted) {
    const last = slots[slots.length - 1];
    if (last && last.endMinute === start) {
      last.endMinute = start + step;
    } else {
      slots.push({ startMinute: start, endMinute: start + step });
    }
  }
  return slots;
}

/** Groups saved slots by weekday (every day present), each sorted by start time. */
export function groupSlotsByWeekday(
  slots: readonly AvailabilitySlot[],
): Record<Weekday, AvailabilitySlot[]> {
  const grouped: Record<Weekday, AvailabilitySlot[]> = {
    MON: [],
    TUE: [],
    WED: [],
    THU: [],
    FRI: [],
    SAT: [],
    SUN: [],
  };
  for (const slot of slots) {
    grouped[slot.weekday].push(slot);
  }
  for (const bucket of Object.values(grouped)) {
    bucket.sort((a, b) => a.startMinute - b.startMinute);
  }
  return grouped;
}

/**
 * Produces the full-week payload after editing a single weekday: every other
 * day's slots are preserved, and `weekday`'s slots are replaced by `daySlots`.
 */
export function replaceDaySlots(
  allSlots: readonly AvailabilitySlot[],
  weekday: Weekday,
  daySlots: readonly MinuteRange[],
): AvailabilitySlotInput[] {
  const others = allSlots
    .filter((slot) => slot.weekday !== weekday)
    .map((slot) => ({
      weekday: slot.weekday,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
    }));
  const replaced = daySlots.map((slot) => ({
    weekday,
    startMinute: slot.startMinute,
    endMinute: slot.endMinute,
  }));
  return [...others, ...replaced];
}
