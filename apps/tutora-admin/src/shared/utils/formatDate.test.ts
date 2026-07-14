import { describe, expect, it } from 'vitest';

import { formatDate, formatDateTime } from './formatDate';

describe('formatDate', () => {
  it('returns a dash for empty or nullish input', () => {
    expect(formatDate(null, 'en')).toBe('—');
    expect(formatDate(undefined, 'en')).toBe('—');
    expect(formatDate('', 'en')).toBe('—');
  });

  it('returns a dash for an unparseable date', () => {
    expect(formatDate('not-a-date', 'en')).toBe('—');
  });

  it('formats a valid ISO date for the given locale', () => {
    const result = formatDate('2026-07-14T00:00:00.000Z', 'en');
    expect(result).not.toBe('—');
    expect(result).toContain('2026');
  });
});

describe('formatDateTime', () => {
  it('returns a dash for invalid input', () => {
    expect(formatDateTime(null, 'en')).toBe('—');
    expect(formatDateTime('nope', 'en')).toBe('—');
  });

  it('includes the year for a valid date', () => {
    expect(formatDateTime('2026-07-14T09:30:00.000Z', 'en')).toContain('2026');
  });
});
