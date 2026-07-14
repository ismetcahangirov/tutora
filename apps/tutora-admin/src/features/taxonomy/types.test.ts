import { describe, expect, it } from 'vitest';

import {
  codeSchema,
  parseTaxonomyItem,
  parseTaxonomyList,
  slugSchema,
  TAXONOMY_CONFIGS,
} from './types';

describe('parseTaxonomyList', () => {
  it('parses a categories payload', () => {
    const items = parseTaxonomyList('categories', [
      { id: 'c1', name: 'Sciences', slug: 'sciences' },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.slug).toBe('sciences');
  });

  it('parses a subjects payload with a nullable category', () => {
    const items = parseTaxonomyList('subjects', [
      { id: 's1', name: 'Maths', slug: 'maths', categoryId: 'c1' },
      { id: 's2', name: 'Chess', slug: 'chess', categoryId: null },
    ]);
    expect(items[0]?.categoryId).toBe('c1');
    expect(items[1]?.categoryId).toBeNull();
  });

  it('parses a languages payload with a code', () => {
    const items = parseTaxonomyList('languages', [{ id: 'l1', name: 'English', code: 'en' }]);
    expect(items[0]?.code).toBe('en');
  });

  it('rejects a malformed item', () => {
    expect(() => parseTaxonomyItem('categories', { id: 'c1', name: 'X' })).toThrow();
  });
});

describe('field schemas', () => {
  it('accepts a valid slug and rejects an invalid one', () => {
    expect(slugSchema.safeParse('data-science').success).toBe(true);
    expect(slugSchema.safeParse('Data Science').success).toBe(false);
  });

  it('accepts a valid language code and rejects an invalid one', () => {
    expect(codeSchema.safeParse('az').success).toBe(true);
    expect(codeSchema.safeParse('EN').success).toBe(false);
    expect(codeSchema.safeParse('a').success).toBe(false);
  });
});

describe('TAXONOMY_CONFIGS', () => {
  it('marks only subjects as owning a category', () => {
    expect(TAXONOMY_CONFIGS.subjects.hasCategory).toBe(true);
    expect(TAXONOMY_CONFIGS.categories.hasCategory).toBe(false);
  });

  it('uses a code identifier only for languages', () => {
    expect(TAXONOMY_CONFIGS.languages.field).toBe('code');
    expect(TAXONOMY_CONFIGS.subjects.field).toBe('slug');
  });
});
