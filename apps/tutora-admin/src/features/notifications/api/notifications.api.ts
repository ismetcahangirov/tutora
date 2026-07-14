/**
 * Admin notifications API (issue #66). Uses the shared Axios client; the response
 * is validated at the boundary with Zod.
 */
import { apiClient } from '@shared/lib';

import { ADMIN_NOTIFICATIONS_BROADCAST_ENDPOINT } from '../constants';
import {
  broadcastResultSchema,
  type BroadcastNotificationBody,
  type BroadcastResult,
} from '../types';

/**
 * Send a notification to an audience segment. The backend fans it out to one
 * in-app record per recipient and pushes to their registered devices, returning
 * how many recipients it reached.
 */
export async function broadcastNotification(
  body: BroadcastNotificationBody,
): Promise<BroadcastResult> {
  const { data } = await apiClient.post<unknown>(ADMIN_NOTIFICATIONS_BROADCAST_ENDPOINT, body);
  return broadcastResultSchema.parse(data);
}
