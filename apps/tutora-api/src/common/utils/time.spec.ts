import { MS_PER_DAY, MS_PER_HOUR, subtractDays, subtractHours } from './time';

describe('time helpers', () => {
  const now = new Date('2026-07-12T12:00:00.000Z');

  it('subtractDays returns a new date the given days earlier', () => {
    expect(subtractDays(now, 7).toISOString()).toBe('2026-07-05T12:00:00.000Z');
  });

  it('subtractHours returns a new date the given hours earlier', () => {
    expect(subtractHours(now, 24).toISOString()).toBe('2026-07-11T12:00:00.000Z');
  });

  it('never mutates the input date', () => {
    const iso = now.toISOString();
    subtractDays(now, 3);
    subtractHours(now, 3);
    expect(now.toISOString()).toBe(iso);
  });

  it('exposes consistent millisecond constants', () => {
    expect(MS_PER_HOUR).toBe(60 * 60 * 1000);
    expect(MS_PER_DAY).toBe(24 * MS_PER_HOUR);
  });
});
