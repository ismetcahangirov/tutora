/**
 * Chat time formatting (student epic #40, #47).
 *
 * Timestamps arrive as ISO strings. These render them the way a chat UI expects:
 * a short `HH:mm` on each bubble, a "today → time, older → date" stamp in the
 * conversation list, and a day classification that drives the in-thread date
 * separators. Formatting is manual (not `Intl`) so it renders identically across
 * Hermes ICU builds, matching `shared/utils/format`.
 */
import { formatShortDate } from '@/shared';

/** Two-digit, zero-padded value (`9` → `"09"`). */
function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Whether two dates fall on the same local calendar day. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Format an ISO timestamp as a 24-hour `HH:mm`. Empty string if unparseable. */
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Conversation-list stamp: the time when the message is from today, otherwise a
 * short date. Returns an empty string for a thread that has no messages yet.
 */
export function formatThreadTimestamp(iso: string | null, now: Date = new Date()): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return isSameDay(date, now) ? formatMessageTime(iso) : formatShortDate(iso);
}

/** A day-separator bucket, relative to `now`. */
export type MessageDayKind = 'today' | 'yesterday' | 'earlier';

/** Classify a message's day so the thread can label its date separators. */
export function messageDayKind(iso: string, now: Date = new Date()): MessageDayKind {
  const date = new Date(iso);
  if (isSameDay(date, now)) {
    return 'today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return isSameDay(date, yesterday) ? 'yesterday' : 'earlier';
}

/** Local calendar-day key (`YYYY-M-D`) for grouping adjacent messages. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
