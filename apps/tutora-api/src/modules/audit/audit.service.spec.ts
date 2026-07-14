import { Test } from '@nestjs/testing';
import { type AuditLog, AuditCategory } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from './audit.service';
import type { AuditActorContext } from './audit.types';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

function auditRow(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: 'a1',
    category: AuditCategory.SYSTEM,
    action: 'feature_flag.updated',
    actorId: 'u1',
    actorEmail: 'admin@example.com',
    entityType: 'FeatureFlag',
    entityId: 'f1',
    metadata: { enabled: true },
    ip: '127.0.0.1',
    userAgent: 'jest',
    createdAt: new Date('2026-07-14T10:00:00Z'),
    ...overrides,
  };
}

function buildPrismaMock() {
  return {
    auditLog: {
      create: jest.fn().mockResolvedValue(auditRow()),
      findMany: jest.fn().mockResolvedValue([auditRow()]),
      count: jest.fn().mockResolvedValue(1),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [AuditService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(AuditService);
}

const actor: AuditActorContext = {
  id: 'u1',
  email: 'admin@example.com',
  ip: '127.0.0.1',
  userAgent: 'jest',
};

function query(overrides: Partial<ListAuditLogsQueryDto> = {}): ListAuditLogsQueryDto {
  return Object.assign(new ListAuditLogsQueryDto(), { page: 1, limit: 20 }, overrides);
}

describe('AuditService.record', () => {
  it('connects the actor relation when the actor is authenticated', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.record(actor, {
      category: AuditCategory.SYSTEM,
      action: 'feature_flag.updated',
      entityType: 'FeatureFlag',
      entityId: 'f1',
      metadata: { enabled: true },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        category: AuditCategory.SYSTEM,
        action: 'feature_flag.updated',
        actorEmail: 'admin@example.com',
        entityType: 'FeatureFlag',
        entityId: 'f1',
        ip: '127.0.0.1',
        userAgent: 'jest',
        metadata: { enabled: true },
        actor: { connect: { id: 'u1' } },
      },
    });
  });

  it('omits the actor relation for an anonymous actor', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.record(
      { id: null, email: 'anonymous', ip: null, userAgent: null },
      { category: AuditCategory.SECURITY, action: 'auth.login_failed' },
    );

    // Exact-match the write: an anonymous, metadata-less event carries no
    // `actor` connect and no `metadata` key at all.
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        category: AuditCategory.SECURITY,
        action: 'auth.login_failed',
        actorEmail: 'anonymous',
        entityType: null,
        entityId: null,
        ip: null,
        userAgent: null,
      },
    });
  });

  it('swallows persistence errors so the primary action is never broken', async () => {
    const prisma = buildPrismaMock();
    prisma.auditLog.create.mockRejectedValueOnce(new Error('db down'));
    const service = await buildService(prisma);

    await expect(
      service.record(actor, { category: AuditCategory.ADMIN, action: 'x.y' }),
    ).resolves.toBeUndefined();
  });
});

describe('AuditService.list', () => {
  it('applies category, free-text, and date-window filters and paginates', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    const result = await service.list(
      query({
        category: AuditCategory.SYSTEM,
        q: 'flag',
        from: '2026-07-01T00:00:00Z',
        to: '2026-07-14T00:00:00Z',
      }),
    );

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          category: AuditCategory.SYSTEM,
          OR: [
            { action: { contains: 'flag', mode: 'insensitive' } },
            { actorEmail: { contains: 'flag', mode: 'insensitive' } },
          ],
          createdAt: {
            gte: new Date('2026-07-01T00:00:00Z'),
            lte: new Date('2026-07-14T00:00:00Z'),
          },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('builds an empty filter set when no filters are supplied', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma);

    await service.list(query());

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
