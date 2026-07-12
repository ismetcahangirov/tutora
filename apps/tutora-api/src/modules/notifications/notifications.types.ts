import type { NotificationType, Prisma } from '@prisma/client';

/**
 * Audience segments a broadcast can target (#35 segmentation). Kept as a plain
 * TS enum (not persisted) because it only scopes *which* users a broadcast fans
 * out to; each recipient still gets an individual {@link NotificationView}.
 */
export enum NotificationAudience {
  ALL = 'ALL',
  STUDENTS = 'STUDENTS',
  TUTORS = 'TUTORS',
}

/** A user-facing in-app notification, projected for the API. */
export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Prisma.JsonValue | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

/** A registered push target, projected for the API (the raw token is never echoed). */
export interface DeviceView {
  id: string;
  platform: string;
  lastUsedAt: Date;
  createdAt: Date;
}

/**
 * The content of a notification, independent of its recipient(s). Consumed by
 * `notifyUser` / `broadcast` so other modules can raise notifications through
 * one typed API.
 */
export interface NotifyInput {
  type?: NotificationType;
  title: string;
  body: string;
  /** Optional deep-link payload persisted with the in-app record. */
  data?: Prisma.InputJsonValue;
}

/** A push message handed to the transport. `data` values must be strings (FCM). */
export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Outcome of a push send. `invalidTokens` should be pruned by the caller. */
export interface PushResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}
