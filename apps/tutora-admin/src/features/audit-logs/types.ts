/**
 * Audit-log contracts (issue #71). Mirrors the API's `AuditLogView`. Zod
 * validates every backend payload at the boundary; TypeScript types are inferred
 * from the schema. Dates arrive as ISO strings over JSON.
 */
import { z } from 'zod';

/** Audit categories (mirrors Prisma `AuditCategory`). */
export const AUDIT_CATEGORIES = ['ADMIN', 'SECURITY', 'SYSTEM'] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

/** One entry in the append-only audit trail. */
export const auditLogSchema = z.object({
  id: z.string(),
  category: z.enum(AUDIT_CATEGORIES),
  action: z.string(),
  actorId: z.string().nullable(),
  actorEmail: z.string(),
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  metadata: z.unknown(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

/** Query parameters for the paginated audit-log list. */
export type ListAuditLogsParams = {
  page: number;
  limit: number;
  category?: AuditCategory;
  q?: string;
  from?: string;
  to?: string;
};
