/**
 * DayEditorSheet (#55) — hour-block picker that seeds from a day's saved windows,
 * previews the merged selection, and hands the merged windows back on save.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import type { AvailabilitySlot } from '@features/availability/types';
import { DayEditorSheet } from '../DayEditorSheet';

describe('DayEditorSheet (#55)', () => {
  it('seeds the preview from the day’s saved slots', async () => {
    const slots: AvailabilitySlot[] = [
      { id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 },
    ];

    await renderWithProviders(
      <DayEditorSheet
        weekday="MON"
        daySlots={slots}
        isSaving={false}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByText('09:00 – 11:00')).toBeOnTheScreen();
  });

  it('toggles an hour block and previews the merged window', async () => {
    await renderWithProviders(
      <DayEditorSheet
        weekday="MON"
        daySlots={[]}
        isSaving={false}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByText('09:00'));
    expect(screen.getByText('09:00 – 10:00')).toBeOnTheScreen();
  });

  it('saves the merged windows built from the selected blocks', async () => {
    const onSave = jest.fn();

    await renderWithProviders(
      <DayEditorSheet
        weekday="MON"
        daySlots={[]}
        isSaving={false}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.press(screen.getByText('09:00'));
    await fireEvent.press(screen.getByText('10:00'));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith([{ startMinute: 540, endMinute: 660 }]);
  });
});
