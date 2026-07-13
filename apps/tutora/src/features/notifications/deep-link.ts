/**
 * Notification deep-linking (student epic #40, #50).
 *
 * A tapped push/notification carries an optional free-form `data` payload. This
 * maps the conventional keys the backend attaches (a chat `threadId`, a `tutorId`)
 * to an in-app route, falling back to the notification feed when the payload is
 * absent or unrecognized — so a tap always lands somewhere sensible. Route shapes
 * match the app's typed routes, so `router.push(route)` needs no cast.
 */
import type { NotificationData } from './types';

/** A navigation target for `router.push`, matching the app's root routes. */
export type NotificationRoute =
  | { pathname: '/chat/[id]'; params: { id: string } }
  | { pathname: '/tutor/[id]'; params: { id: string } }
  | { pathname: '/notifications' };

/** A non-empty string, or `null` for anything else (numbers, objects, blanks). */
function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Resolve where tapping a notification should navigate. */
export function resolveNotificationRoute(data: NotificationData | null): NotificationRoute {
  if (data) {
    const threadId = asString(data.threadId);
    if (threadId) {
      return { pathname: '/chat/[id]', params: { id: threadId } };
    }
    const tutorId = asString(data.tutorId);
    if (tutorId) {
      return { pathname: '/tutor/[id]', params: { id: tutorId } };
    }
  }
  return { pathname: '/notifications' };
}
