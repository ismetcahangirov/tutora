import { describe, expect, it } from 'vitest';

import { contentEntrySchema, slugSchema } from './types';

const rawEntry = {
  id: 'c1',
  type: 'FAQ',
  locale: 'en',
  slug: 'how-it-works',
  title: 'How it works',
  excerpt: null,
  body: 'Body copy.',
  coverImageUrl: null,
  order: 0,
  status: 'DRAFT',
  publishedAt: null,
  authorId: null,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
};

describe('contentEntrySchema', () => {
  it('parses a valid content entry payload', () => {
    const entry = contentEntrySchema.parse(rawEntry);
    expect(entry.type).toBe('FAQ');
    expect(entry.status).toBe('DRAFT');
  });

  it('rejects an unknown content type', () => {
    expect(contentEntrySchema.safeParse({ ...rawEntry, type: 'PODCAST' }).success).toBe(false);
  });

  it('rejects an unknown status', () => {
    expect(contentEntrySchema.safeParse({ ...rawEntry, status: 'ARCHIVED' }).success).toBe(false);
  });
});

describe('slugSchema', () => {
  it('accepts a kebab-case slug', () => {
    expect(slugSchema.safeParse('how-it-works').success).toBe(true);
  });

  it('rejects uppercase, spaces, and leading/trailing hyphens', () => {
    expect(slugSchema.safeParse('How It Works').success).toBe(false);
    expect(slugSchema.safeParse('-leading').success).toBe(false);
    expect(slugSchema.safeParse('trailing-').success).toBe(false);
  });
});
