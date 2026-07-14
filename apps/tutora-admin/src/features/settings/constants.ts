import { API_PREFIX } from '@shared/lib';

/** Admin platform-settings endpoints (relative to `VITE_API_URL`). */
export const ADMIN_FEATURE_FLAGS_ENDPOINT = `${API_PREFIX}/admin/feature-flags`;
export const ADMIN_SETTINGS_ENDPOINT = `${API_PREFIX}/admin/settings`;

/**
 * Query keys. Each resource's list is small and rarely changes, so it is cached
 * under a single stable key that mutations invalidate wholesale.
 */
export const settingsKeys = {
  flags: ['admin', 'feature-flags'] as const,
  settings: ['admin', 'system-settings'] as const,
};
