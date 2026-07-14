import { API_PREFIX } from '@shared/lib';

/** Admin dashboard analytics endpoint (relative to `VITE_API_URL`). */
export const ADMIN_DASHBOARD_ENDPOINT = `${API_PREFIX}/admin/dashboard`;

/** Query keys for the dashboard analytics. */
export const dashboardKeys = {
  stats: ['admin', 'dashboard', 'stats'] as const,
};
