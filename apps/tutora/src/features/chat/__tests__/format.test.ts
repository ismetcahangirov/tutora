/**
 * chat time helpers (#47) — deterministic across timezones by building inputs
 * from local `Date` components (`toISOString()` round-trips to the same instant).
 */
import { formatMessageTime, formatThreadTimestamp, messageDayKind } from '../format';

/** Local wall-clock time → an ISO string representing that same instant. */
function isoAt(year: number, month1: number, day: number, hour = 0, minute = 0): string {
  return new Date(year, month1 - 1, day, hour, minute).toISOString();
}

describe('formatMessageTime', () => {
  it('formats as zero-padded 24h HH:mm', () => {
    expect(formatMessageTime(isoAt(2026, 7, 13, 9, 5))).toBe('09:05');
    expect(formatMessageTime(isoAt(2026, 7, 13, 18, 30))).toBe('18:30');
  });

  it('returns an empty string for an unparseable input', () => {
    expect(formatMessageTime('not-a-date')).toBe('');
  });
});

describe('formatThreadTimestamp', () => {
  const now = new Date(2026, 6, 13, 12, 0); // 13 Jul 2026, local noon

  it('shows the time for a message sent today', () => {
    expect(formatThreadTimestamp(isoAt(2026, 7, 13, 8, 15), now)).toBe('08:15');
  });

  it('shows a short date for an older message', () => {
    expect(formatThreadTimestamp(isoAt(2026, 7, 10, 8, 15), now)).toBe('10.7.2026');
  });

  it('returns an empty string when there is no timestamp', () => {
    expect(formatThreadTimestamp(null, now)).toBe('');
  });
});

describe('messageDayKind', () => {
  const now = new Date(2026, 6, 13, 12, 0);

  it('classifies today, yesterday, and earlier', () => {
    expect(messageDayKind(isoAt(2026, 7, 13, 1, 0), now)).toBe('today');
    expect(messageDayKind(isoAt(2026, 7, 12, 23, 0), now)).toBe('yesterday');
    expect(messageDayKind(isoAt(2026, 7, 1, 10, 0), now)).toBe('earlier');
  });
});
