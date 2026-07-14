/**
 * Dashboard analytics API (issue #61). Uses the shared Axios client; the
 * response is validated at the boundary with Zod.
 */
import { apiClient } from '@shared/lib';

import { ADMIN_DASHBOARD_ENDPOINT } from '../constants';
import { dashboardStatsSchema, type DashboardStats } from '../types';

/** Fetch the dashboard KPIs, tutor-status breakdown, and signups trend. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<unknown>(ADMIN_DASHBOARD_ENDPOINT);
  return dashboardStatsSchema.parse(data);
}
