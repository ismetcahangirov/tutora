import { describe, expect, it } from 'vitest';

import { auditLogSchema } from './types';

const rawLog = {
  id: 'a1',
  category: 'SYSTEM',
  action: 'feature_flag.updated',
  actorId: 'admin1',
  actorEmail: 'admin@example.com',
  entityType: 'FeatureFlag',
  entityId: 'f1',
  metadata: { enabled: true },
  ip: '127.0.0.1',
  userAgent: 'jest',
  createdAt: '2026-07-14T10:00:00.000Z',
};

describe('auditLogSchema', () => {
  it('parses a valid audit-log payload', () => {
    const log = auditLogSchema.parse(rawLog);
    expect(log.category).toBe('SYSTEM');
    expect(log.action).toBe('feature_flag.updated');
  });

  it('accepts a null actor and absent metadata (anonymous, no payload)', () => {
    const log = auditLogSchema.parse({
      ...rawLog,
      actorId: null,
      metadata: null,
      ip: null,
      userAgent: null,
    });
    expect(log.actorId).toBeNull();
    expect(log.metadata).toBeNull();
  });

  it('rejects an unknown category', () => {
    expect(auditLogSchema.safeParse({ ...rawLog, category: 'OTHER' }).success).toBe(false);
  });
});
