/**
 * Notifications feature — endpoints, query keys, defaults (student epic #40, #50).
 *
 * User-facing copy lives in the i18n catalogs under `notifications.*`; this file
 * holds only stable, non-localized constants. The device-token bound mirrors the
 * backend `RegisterDeviceDto` so the client never sends a doomed request.
 */

/** Authenticated notification endpoints, appended to `EXPO_PUBLIC_API_URL`. */
export const NOTIFICATION_ENDPOINTS = {
  /** The caller's notification feed (paginated) and read-all live under `/notifications`. */
  root: '/api/v1/notifications',
  unreadCount: '/api/v1/notifications/unread-count',
  readAll: '/api/v1/notifications/read-all',
  /** Register a push token. */
  devices: '/api/v1/notifications/devices',
  /** Mark one notification read: `/notifications/:id/read`. */
  read: (id: string) => `/api/v1/notifications/${id}/read`,
} as const;

/** Default page size for the notification feed. Matches the backend default. */
export const DEFAULT_PAGE_SIZE = 20;

/** Upper bound on a device push token. Mirrors the backend `RegisterDeviceDto`. */
export const DEVICE_TOKEN_MAX_LENGTH = 4096;

/** How often the unread badge refreshes while the app is mounted. */
export const UNREAD_POLL_INTERVAL = 30_000;

/** Badge caps out here so a large count never blows out its container. */
export const UNREAD_BADGE_MAX = 99;

/**
 * Structured, stable query keys. The feed key carries the `unreadOnly` filter so
 * an all/unread view caches independently; mutations invalidate `all` to refresh
 * every view (feed + badge) at once.
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  feed: (unreadOnly: boolean) => [...notificationKeys.all, 'feed', { unreadOnly }] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};
