/**
 * Schedule helpers (#55) — formatting minutes and translating between the hourly
 * block grid and the backend's `{ startMinute, endMinute }` windows.
 */
import type { AvailabilitySlot } from '@features/availability/types';
import {
  buildDayBlocks,
  formatMinutes,
  formatSlotRange,
  groupSlotsByWeekday,
  mergeStartsToSlots,
  replaceDaySlots,
  slotsToSelectedStarts,
} from '../schedule';

describe('formatMinutes', () => {
  it('formats minutes-from-midnight as zero-padded 24-hour time', () => {
    expect(formatMinutes(0)).toBe('00:00');
    expect(formatMinutes(540)).toBe('09:00');
    expect(formatMinutes(605)).toBe('10:05');
    expect(formatMinutes(1380)).toBe('23:00');
  });
});

describe('formatSlotRange', () => {
  it('joins start and end with an en dash', () => {
    expect(formatSlotRange({ startMinute: 540, endMinute: 660 })).toBe('09:00 – 11:00');
  });
});

describe('buildDayBlocks', () => {
  it('lists block starts whose full block fits before the end', () => {
    expect(buildDayBlocks(360, 540, 60)).toEqual([360, 420, 480]);
  });

  it('excludes a partial trailing block', () => {
    expect(buildDayBlocks(360, 530, 60)).toEqual([360, 420]);
  });
});

describe('slotsToSelectedStarts', () => {
  const blocks = buildDayBlocks(360, 720, 60); // 06:00–12:00 hourly

  it('selects the blocks a window covers', () => {
    expect(slotsToSelectedStarts([{ startMinute: 540, endMinute: 660 }], blocks, 60)).toEqual([
      540, 600,
    ]);
  });

  it('selects an overlapping block even when the window is misaligned', () => {
    expect(slotsToSelectedStarts([{ startMinute: 545, endMinute: 575 }], blocks, 60)).toEqual([
      540,
    ]);
  });

  it('returns nothing when no window overlaps', () => {
    expect(slotsToSelectedStarts([], blocks, 60)).toEqual([]);
  });
});

describe('mergeStartsToSlots', () => {
  it('merges contiguous block starts into one window', () => {
    expect(mergeStartsToSlots([540, 600, 660], 60)).toEqual([{ startMinute: 540, endMinute: 720 }]);
  });

  it('keeps a gap as two separate windows and sorts/dedupes input', () => {
    expect(mergeStartsToSlots([720, 540, 540], 60)).toEqual([
      { startMinute: 540, endMinute: 600 },
      { startMinute: 720, endMinute: 780 },
    ]);
  });

  it('returns nothing for an empty selection', () => {
    expect(mergeStartsToSlots([], 60)).toEqual([]);
  });
});

describe('groupSlotsByWeekday', () => {
  it('buckets slots by weekday, each sorted by start, all days present', () => {
    const slots: AvailabilitySlot[] = [
      { id: 'b', weekday: 'MON', startMinute: 660, endMinute: 720 },
      { id: 'a', weekday: 'MON', startMinute: 540, endMinute: 600 },
      { id: 'c', weekday: 'WED', startMinute: 540, endMinute: 600 },
    ];

    const grouped = groupSlotsByWeekday(slots);

    expect(grouped.MON.map((s) => s.id)).toEqual(['a', 'b']);
    expect(grouped.WED.map((s) => s.id)).toEqual(['c']);
    expect(grouped.SUN).toEqual([]);
  });
});

describe('replaceDaySlots', () => {
  const all: AvailabilitySlot[] = [
    { id: 'm1', weekday: 'MON', startMinute: 540, endMinute: 600 },
    { id: 't1', weekday: 'TUE', startMinute: 600, endMinute: 660 },
  ];

  it('replaces only the target weekday and preserves the others (id-free)', () => {
    const result = replaceDaySlots(all, 'MON', [{ startMinute: 720, endMinute: 780 }]);

    expect(result).toEqual([
      { weekday: 'TUE', startMinute: 600, endMinute: 660 },
      { weekday: 'MON', startMinute: 720, endMinute: 780 },
    ]);
  });

  it('clears a weekday when given no windows', () => {
    const result = replaceDaySlots(all, 'MON', []);

    expect(result).toEqual([{ weekday: 'TUE', startMinute: 600, endMinute: 660 }]);
  });
});
