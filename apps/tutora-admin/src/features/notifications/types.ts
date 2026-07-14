/**
 * Notification composer contracts (issue #66). Mirrors the API's broadcast DTO
 * (`POST /api/v1/admin/notifications/broadcast`) and its `NotificationAudience`
 * segment. The client validates the response at the boundary with Zod; the
 * request shape is a plain type since it's authored, not parsed.
 */
import { z } from 'zod';

/** Audience segments a broadcast can target (mirrors the API's `NotificationAudience`). */
export const NOTIFICATION_AUDIENCES = ['ALL', 'STUDENTS', 'TUTORS'] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

/**
 * Notification kinds an admin may broadcast. The API's `NotificationType` enum
 * also carries event-driven kinds (`CHAT_MESSAGE`, `APPLICATION`, `REVIEW`) that
 * the system raises automatically, so the hand-authored composer exposes only the
 * two that make sense as a deliberate broadcast.
 */
export const BROADCAST_NOTIFICATION_TYPES = ['ANNOUNCEMENT', 'SYSTEM'] as const;
export type BroadcastNotificationType = (typeof BROADCAST_NOTIFICATION_TYPES)[number];

/** Field bounds — mirror the API DTO so the client can fail fast before the round-trip. */
export const NOTIFICATION_TITLE_MAX_LENGTH = 120;
export const NOTIFICATION_BODY_MAX_LENGTH = 1000;

/** Body of `POST /admin/notifications/broadcast`. */
export type BroadcastNotificationBody = {
  audience: NotificationAudience;
  type: BroadcastNotificationType;
  title: string;
  body: string;
};

/** Result of a broadcast: how many recipients the server fanned it out to. */
export const broadcastResultSchema = z.object({
  recipients: z.number().int().nonnegative(),
});

export type BroadcastResult = z.infer<typeof broadcastResultSchema>;
