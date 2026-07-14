import { describe, expect, it } from 'vitest';

import {
  BROADCAST_NOTIFICATION_TYPES,
  broadcastResultSchema,
  NOTIFICATION_AUDIENCES,
} from './types';

describe('broadcastResultSchema', () => {
  it('parses a valid broadcast result', () => {
    expect(broadcastResultSchema.parse({ recipients: 42 }).recipients).toBe(42);
  });

  it('accepts a zero-recipient result (empty segment)', () => {
    expect(broadcastResultSchema.parse({ recipients: 0 }).recipients).toBe(0);
  });

  it('ignores extra fields the API may add', () => {
    expect(broadcastResultSchema.parse({ recipients: 3, jobId: 'x' }).recipients).toBe(3);
  });

  it('rejects a negative or non-integer recipient count', () => {
    expect(broadcastResultSchema.safeParse({ recipients: -1 }).success).toBe(false);
    expect(broadcastResultSchema.safeParse({ recipients: 1.5 }).success).toBe(false);
  });

  it('rejects a missing recipient count', () => {
    expect(broadcastResultSchema.safeParse({}).success).toBe(false);
  });
});

describe('composer enums', () => {
  it('lists the three audience segments', () => {
    expect(NOTIFICATION_AUDIENCES).toEqual(['ALL', 'STUDENTS', 'TUTORS']);
  });

  it('only exposes hand-authorable notification types', () => {
    expect(BROADCAST_NOTIFICATION_TYPES).toEqual(['ANNOUNCEMENT', 'SYSTEM']);
  });
});
