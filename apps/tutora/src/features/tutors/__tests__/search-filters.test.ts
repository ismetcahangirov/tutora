/**
 * deriveSearchParams + countActiveFilters (#40, #43) — chip selection projected
 * to typed API params, and the active-filter count.
 */
import { countActiveFilters, deriveSearchParams } from '../search-filters';

describe('deriveSearchParams (#43)', () => {
  it('returns empty params for no selection and blank query', () => {
    expect(deriveSearchParams({}, '   ')).toEqual({
      q: undefined,
      subjectId: undefined,
      districtId: undefined,
      languageId: undefined,
      format: undefined,
      minRating: undefined,
      sort: undefined,
    });
  });

  it('picks the single value for single-select sections', () => {
    const params = deriveSearchParams(
      {
        subject: ['sub-1'],
        district: ['dist-2'],
        language: ['lang-3'],
        format: ['ONLINE'],
        sort: ['newest'],
      },
      'algebra',
    );
    expect(params).toMatchObject({
      q: 'algebra',
      subjectId: 'sub-1',
      districtId: 'dist-2',
      languageId: 'lang-3',
      format: 'ONLINE',
      sort: 'newest',
    });
  });

  it('parses a closed price range into min and max', () => {
    const params = deriveSearchParams({ price: ['20-40'] }, '');
    expect(params.minPrice).toBe(20);
    expect(params.maxPrice).toBe(40);
  });

  it('parses an open-ended price range (no maximum)', () => {
    const params = deriveSearchParams({ price: ['60-'] }, '');
    expect(params.minPrice).toBe(60);
    expect(params.maxPrice).toBeUndefined();
  });

  it('converts the rating threshold to a number', () => {
    expect(deriveSearchParams({ rating: ['4.5'] }, '').minRating).toBe(4.5);
  });

  it('trims the query and treats whitespace-only as no query', () => {
    expect(deriveSearchParams({}, '  math  ').q).toBe('math');
    expect(deriveSearchParams({}, '   ').q).toBeUndefined();
  });
});

describe('countActiveFilters (#43)', () => {
  it('counts only sections with at least one selected value', () => {
    expect(countActiveFilters({ subject: ['a'], district: [], format: ['ONLINE'] })).toBe(2);
    expect(countActiveFilters({})).toBe(0);
  });
});
