import { API_PREFIX } from '@shared/lib';

import type { ListAuditLogsParams } from './types';

/** Admin audit-log endpoint (relative to `VITE_API_URL`). */
export const ADMIN_AUDIT_LOGS_ENDPOINT = `${API_PREFIX}/admin/audit-logs`;

/** Page size for the audit-log table. */
export const AUDIT_LOGS_PAGE_SIZE = 20;

/** Structured, stable query keys so navigation between pages caches precisely. */
export const auditLogsKeys = {
  all: ['admin', 'audit-logs'] as const,
  list: (params: ListAuditLogsParams) => ['admin', 'audit-logs', 'list', params] as const,
};
