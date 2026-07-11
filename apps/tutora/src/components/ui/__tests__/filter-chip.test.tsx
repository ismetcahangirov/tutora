/**
 * FilterChip selected state + press (issue #15).
 */
import { FilterChip } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('FilterChip (#15)', () => {
  it('exposes its selected state to assistive tech', async () => {
    await renderWithProviders(<FilterChip label="Online" selected />);
    expect(screen.getByRole('button')).toBeSelected();
  });

  it('is not selected by default and fires onPress', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<FilterChip label="Math" onPress={onPress} />);

    const chip = screen.getByRole('button');
    expect(chip).not.toBeSelected();
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
