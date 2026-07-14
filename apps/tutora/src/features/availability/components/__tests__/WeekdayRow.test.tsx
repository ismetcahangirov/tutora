/**
 * WeekdayRow (#55) — shows a weekday with its saved ranges (or an unavailable
 * hint) and opens the editor when tapped.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import type { AvailabilitySlot } from '@features/availability/types';
import { WeekdayRow } from '../WeekdayRow';

const SLOTS: AvailabilitySlot[] = [
  { id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 },
  { id: 'a2', weekday: 'MON', startMinute: 780, endMinute: 840 },
];

describe('WeekdayRow (#55)', () => {
  it('renders the weekday and its saved ranges', async () => {
    await renderWithProviders(<WeekdayRow weekday="MON" slots={SLOTS} onPress={jest.fn()} />);

    expect(screen.getByText('Monday')).toBeOnTheScreen();
    expect(screen.getByText('09:00 – 11:00, 13:00 – 14:00')).toBeOnTheScreen();
  });

  it('shows the unavailable hint when there are no slots', async () => {
    await renderWithProviders(<WeekdayRow weekday="TUE" slots={[]} onPress={jest.fn()} />);

    expect(screen.getByText('Tuesday')).toBeOnTheScreen();
    expect(screen.getByText('Unavailable')).toBeOnTheScreen();
  });

  it('fires onPress when the row is tapped', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<WeekdayRow weekday="MON" slots={SLOTS} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
