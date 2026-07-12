import type { DeviceToken, Notification } from '@prisma/client';
import type { DeviceView, NotificationView } from './notifications.types';

/** Projects a persisted notification into its API view. */
export function toNotificationView(row: Notification): NotificationView {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data ?? null,
    isRead: row.readAt !== null,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

/** Projects a registered device, deliberately omitting the raw FCM token. */
export function toDeviceView(row: DeviceToken): DeviceView {
  return {
    id: row.id,
    platform: row.platform,
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
  };
}
