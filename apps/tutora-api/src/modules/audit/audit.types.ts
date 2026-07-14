import type { AuditCategory, AuditLog, Prisma } from '@prisma/client';

/**
 * Who performed an audited action and from where. Assembled by the `@AuditActor`
 * decorator from the authenticated principal and the HTTP request, then passed
 * to `AuditService.record`. `id` is null when the actor is unauthenticated (an
 * anonymous security event); `email` is always captured so the trail is
 * human-readable even after the account is deleted.
 */
export interface AuditActorContext {
  id: string | null;
  email: string;
  ip: string | null;
  userAgent: string | null;
}

/** The details of an action to persist, independent of who performed it. */
export interface RecordAuditInput {
  category: AuditCategory;
  /** Dot-namespaced verb, e.g. `feature_flag.updated`. */
  action: string;
  /** The affected resource's type and id, when the action targets one. */
  entityType?: string | null;
  entityId?: string | null;
  /** Optional structured payload (e.g. the changed fields). */
  metadata?: Prisma.InputJsonValue;
}

/** Admin-facing projection of an audit-log row. */
export interface AuditLogView {
  id: string;
  category: AuditCategory;
  action: string;
  actorId: string | null;
  actorEmail: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Prisma.JsonValue;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/** Maps a full `AuditLog` row to the admin-facing view. */
export function toAuditLogView(log: AuditLog): AuditLogView {
  return {
    id: log.id,
    category: log.category,
    action: log.action,
    actorId: log.actorId,
    actorEmail: log.actorEmail,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata ?? null,
    ip: log.ip,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
  };
}
