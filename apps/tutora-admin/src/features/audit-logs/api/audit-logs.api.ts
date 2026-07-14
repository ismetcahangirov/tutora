/**
 * Audit-log API (issue #71). Uses the shared Axios client; the response is
 * validated at the boundary with Zod. Backed by the API's `admin/audit-logs`
 * controller. Read-only — the trail is append-only.
 */
import { apiClient, paginatedSchema, type Paginated } from '@shared/lib';

import { ADMIN_AUDIT_LOGS_ENDPOINT } from '../constants';
import { auditLogSchema, type AuditLog, type ListAuditLogsParams } from '../types';

const auditLogsPageSchema = paginatedSchema(auditLogSchema);

/** List audit-log entries (paginated, filterable by category, text, and date). */
export async function listAuditLogs(params: ListAuditLogsParams): Promise<Paginated<AuditLog>> {
  const { data } = await apiClient.get<unknown>(ADMIN_AUDIT_LOGS_ENDPOINT, {
    params: {
      page: params.page,
      limit: params.limit,
      category: params.category,
      q: params.q || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
    },
  });
  return auditLogsPageSchema.parse(data);
}
