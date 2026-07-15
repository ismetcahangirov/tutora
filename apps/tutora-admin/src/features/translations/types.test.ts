import { describe, expect, it } from 'vitest';

import { keySchema, namespaceSchema, translationSchema } from './types';

const rawTranslation = {
  id: 't1',
  namespace: 'search',
  key: 'filter.district',
  description: null,
  values: { az: 'Rayon', en: 'District', ru: 'Район' },
  updatedById: null,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
};

describe('translationSchema', () => {
  it('parses a valid translation payload', () => {
    const entry = translationSchema.parse(rawTranslation);
    expect(entry.key).toBe('filter.district');
    expect(entry.values.az).toBe('Rayon');
  });

  it('parses a partial values map', () => {
    const entry = translationSchema.parse({ ...rawTranslation, values: { az: 'Rayon' } });
    expect(entry.values.en).toBeUndefined();
  });

  it('rejects a non-string localized value', () => {
    expect(translationSchema.safeParse({ ...rawTranslation, values: { az: 12 } }).success).toBe(
      false,
    );
  });
});

describe('keySchema', () => {
  it('accepts dot- and underscore-joined segments', () => {
    expect(keySchema.safeParse('filter.district').success).toBe(true);
    expect(keySchema.safeParse('errors.not_authorized').success).toBe(true);
  });

  it('rejects spaces, leading dots, and trailing dots', () => {
    expect(keySchema.safeParse('filter district').success).toBe(false);
    expect(keySchema.safeParse('.leading').success).toBe(false);
    expect(keySchema.safeParse('trailing.').success).toBe(false);
  });
});

describe('namespaceSchema', () => {
  it('accepts a single alphanumeric word', () => {
    expect(namespaceSchema.safeParse('common').success).toBe(true);
  });

  it('rejects dots, hyphens, and a leading digit', () => {
    expect(namespaceSchema.safeParse('search.filter').success).toBe(false);
    expect(namespaceSchema.safeParse('my-namespace').success).toBe(false);
    expect(namespaceSchema.safeParse('1namespace').success).toBe(false);
  });
});
