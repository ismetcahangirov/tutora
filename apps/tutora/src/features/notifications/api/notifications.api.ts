/**
 * notifications API — feed, read state, and device registration (#40, #50; backend #35).
 *
 * Every endpoint is authenticated (the shared client attaches the bearer token and
 * refreshes transparently). The feed returns the standard paginated envelope; the
 * read/register calls return the affected record so the UI can reconcile.
 */
import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';

import { DEFAULT_PAGE_SIZE, NOTIFICATION_ENDPOINTS } from '../constants';
import type {
  AppNotification,
  NotificationsPageParams,
  RegisterDeviceInput,
  RegisteredDevice,
} from '../types';

/** Drop `undefined` params so the request URL stays clean and cacheable. */
function toQueryParams(params: NotificationsPageParams): Record<string, number | boolean> {
  const query: Record<string, number | boolean> = {};
  if (params.page !== undefined) {
    query.page = params.page;
  }
  if (params.limit !== undefined) {
    query.limit = params.limit;
  }
  if (params.unreadOnly) {
    query.unreadOnly = true;
  }
  return query;
}

/** GET a page of the caller's notifications, newest first. */
export async function listNotifications(
  params: NotificationsPageParams,
): Promise<Paginated<AppNotification>> {
  const { data } = await apiClient.get<Paginated<AppNotification>>(NOTIFICATION_ENDPOINTS.root, {
    params: toQueryParams({ limit: DEFAULT_PAGE_SIZE, ...params }),
  });
  return data;
}

/** GET the caller's unread notification count (badge). */
export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>(NOTIFICATION_ENDPOINTS.unreadCount);
  return data;
}

/** Mark a single notification read and return the updated record. */
export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await apiClient.post<AppNotification>(NOTIFICATION_ENDPOINTS.read(id));
  return data;
}

/** Mark every notification read and return how many changed. */
export async function markAllNotificationsRead(): Promise<{ readCount: number }> {
  const { data } = await apiClient.post<{ readCount: number }>(NOTIFICATION_ENDPOINTS.readAll);
  return data;
}

/** Register (or re-own) a device push token for the caller. */
export async function registerDevice(input: RegisterDeviceInput): Promise<RegisteredDevice> {
  const { data } = await apiClient.post<RegisteredDevice>(NOTIFICATION_ENDPOINTS.devices, input);
  return data;
}
