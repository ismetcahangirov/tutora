import { describe, expect, it } from 'vitest';

import { getInitials } from './initials';

describe('getInitials (#60)', () => {
  it('uses the first and last name initials', () => {
    expect(getInitials('Ada Lovelace', 'a@t.co')).toBe('AL');
    expect(getInitials('Ada Byron Lovelace', 'a@t.co')).toBe('AL');
  });

  it('takes two letters from a single name', () => {
    expect(getInitials('Ada', 'a@t.co')).toBe('AD');
  });

  it('falls back to the email when there is no name', () => {
    expect(getInitials(null, 'zoe@t.co')).toBe('ZO');
    expect(getInitials('   ', 'zoe@t.co')).toBe('ZO');
  });
});
