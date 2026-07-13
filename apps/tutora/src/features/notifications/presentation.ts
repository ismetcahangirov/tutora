/**
 * Notification presentation helpers (student epic #40, #50).
 *
 * Pure mappers that turn a notification's type into a design-system icon and its
 * ISO timestamp into a compact stamp (today → `HH:mm`, older → short date).
 * Formatting is manual (not `Intl`) so it renders identically across Hermes ICU
 * builds, matching `shared/utils/format`.
 */
import type { IconName } from '@/components/ui';
import { formatShortDate } from '@/shared';

import type { NotificationType } from './types';

/** The leading icon for each notification type; `SYSTEM` is the bell default. */
const TYPE_ICONS: Record<NotificationType, IconName> = {
  SYSTEM: 'bell',
  CHAT_MESSAGE: 'message-circle',
  APPLICATION: 'inbox',
  REVIEW: 'star',
  ANNOUNCEMENT: 'award',
};

/** Icon token for a notification type. Unknown types fall back to the bell. */
export function iconForNotification(type: NotificationType): IconName {
  return TYPE_ICONS[type] ?? 'bell';
}

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

/**
 * Feed stamp: the `HH:mm` time when the notification is from today, otherwise a
 * short date. Returns an empty string for an unparseable timestamp.
 */
export function formatNotificationTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return isSameDay(date, now)
    ? `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
    : formatShortDate(iso);
}
