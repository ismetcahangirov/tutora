import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import {
  type AuditActorContext,
  type AuditLogView,
  type RecordAuditInput,
  toAuditLogView,
} from './audit.types';

/**
 * Writes and reads the audit trail (#71). Other modules inject this service and
 * call {@link record} after a privileged action; the admin log view calls
 * {@link list}. Writes are **best-effort**: a failed audit write is logged but
 * never propagates, so it can't break the primary operation it accompanies. The
 * trail itself is append-only — there is no update or delete path.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Records one action. Swallows and logs any persistence error (fail-soft). */
  async record(actor: AuditActorContext, input: RecordAuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          category: input.category,
          action: input.action,
          actorEmail: actor.email,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          ip: actor.ip,
          userAgent: actor.userAgent,
          ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
          ...(actor.id ? { actor: { connect: { id: actor.id } } } : {}),
        },
      });
    } catch (error) {
      // An audit failure must not surface to the caller; record it and move on.
      this.logger.error(
        `Failed to write audit log "${input.action}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Paginated, filterable trail, newest first. */
  async list(query: ListAuditLogsQueryDto): Promise<Paginated<AuditLogView>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.category) {
      where.category = query.category;
    }
    if (query.q) {
      where.OR = [
        { action: { contains: query.q, mode: 'insensitive' } },
        { actorEmail: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPage(rows.map(toAuditLogView), total, query.page, query.limit);
  }
}
