import { describe, expect, it } from 'vitest';

import { formatMoney } from './formatMoney';

describe('formatMoney', () => {
  it('formats an amount in the given currency', () => {
    // Non-breaking spaces vary by runtime, so assert on the salient parts.
    const formatted = formatMoney(9.99, 'USD', 'en-US');
    expect(formatted).toContain('9.99');
    expect(formatted).toContain('$');
  });

  it('returns a dash for a null or non-finite amount', () => {
    expect(formatMoney(null, 'AZN', 'en')).toBe('—');
    expect(formatMoney(undefined, 'AZN', 'en')).toBe('—');
    expect(formatMoney(Number.NaN, 'AZN', 'en')).toBe('—');
  });

  it('falls back to amount + raw code for an invalid currency', () => {
    const formatted = formatMoney(10, 'NOTACODE', 'en-US');
    expect(formatted).toContain('10');
    expect(formatted).toContain('NOTACODE');
  });
});
