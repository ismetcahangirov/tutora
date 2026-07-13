/**
 * Formatting helpers (student epic #40) — price, rating, and short-date output.
 */
import { formatPrice, formatRating, formatShortDate } from '../format';

describe('formatPrice (#40)', () => {
  it('trails the amount with the currency symbol', () => {
    expect(formatPrice(25, 'AZN')).toBe('25 ₼');
    expect(formatPrice(40, 'USD')).toBe('40 $');
  });

  it('groups thousands with a space', () => {
    expect(formatPrice(1500, 'RUB')).toBe('1 500 ₽');
  });

  it('renders whole amounts with no decimals and fractional amounts with two', () => {
    expect(formatPrice(30.0, 'AZN')).toBe('30 ₼');
    expect(formatPrice(29.9, 'AZN')).toBe('29.90 ₼');
    expect(formatPrice(29.95, 'AZN')).toBe('29.95 ₼');
  });

  it('falls back to the raw code for an unknown currency', () => {
    expect(formatPrice(10, 'XYZ')).toBe('10 XYZ');
  });
});

describe('formatRating (#40)', () => {
  it('renders one decimal place', () => {
    expect(formatRating(4.8)).toBe('4.8');
    expect(formatRating(5)).toBe('5.0');
  });
});

describe('formatShortDate (#40)', () => {
  it('formats an ISO timestamp as d.m.yyyy', () => {
    // Local-time (no trailing Z) so the day component is timezone-independent.
    expect(formatShortDate('2026-03-09T10:00:00')).toBe('9.3.2026');
  });

  it('returns an empty string for an unparseable input', () => {
    expect(formatShortDate('not-a-date')).toBe('');
  });
});
