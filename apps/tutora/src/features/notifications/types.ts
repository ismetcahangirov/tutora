/**
 * Notifications feature — API contract types (student epic #40, #50; backend #35).
 *
 * These mirror the backend's `NotificationView` / `DeviceView` DTOs, with one
 * honest difference: timestamps arrive as ISO strings over JSON (not `Date`), so
 * every date field is typed `string | null`. The enum unions mirror the Prisma
 * `NotificationType` / `DevicePlatform` enums (the client can't import
 * `@prisma/client`), kept in lock-step with the backend schema.
 */

// Re-export the shared pagination envelope so consumers can import it from the
// feature barrel alongside the notification types.
export type { Paginated, PaginationMeta } from '@/shared';

/** Kind of notification — drives the row's leading icon. Mirrors Prisma `NotificationType`. */
export type NotificationType =
  'SYSTEM' | 'CHAT_MESSAGE' | 'APPLICATION' | 'REVIEW' | 'ANNOUNCEMENT';

/** Push target platform. Mirrors Prisma `DevicePlatform`. */
export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

/**
 * The optional deep-link payload persisted with a notification. The backend types
 * it as free-form JSON; the client reads known keys defensively (see `deep-link`).
 */
export type NotificationData = Record<string, unknown>;

/** A single in-app notification as returned by `GET /api/v1/notifications`. */
export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

/** A registered push target as returned by `POST /api/v1/notifications/devices`. */
export type RegisteredDevice = {
  id: string;
  platform: DevicePlatform;
  lastUsedAt: string;
  createdAt: string;
};

/** Body of `POST /api/v1/notifications/devices`. */
export type RegisterDeviceInput = {
  token: string;
  platform: DevicePlatform;
};

/** Paging for the notification feed. */
export type NotificationsPageParams = {
  page?: number;
  limit?: number;
  /** Return only unread notifications. */
  unreadOnly?: boolean;
};
