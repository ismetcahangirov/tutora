/**
 * ComparisonButton (#46) — press wiring, the selected accessible state, and the
 * disabled-when-full guard (disabled only applies while not already selected).
 */
import { ComparisonButton } from '../ComparisonButton';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('ComparisonButton (#46)', () => {
  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <ComparisonButton active={false} onPress={onPress} accessibilityLabel="Add to compare" />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Add to compare' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the selected state when active', async () => {
    await renderWithProviders(
      <ComparisonButton active onPress={jest.fn()} accessibilityLabel="Remove from compare" />,
    );

    expect(
      screen.getByRole('button', { name: 'Remove from compare', selected: true }),
    ).toBeOnTheScreen();
  });

  it('ignores taps when disabled and not selected', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <ComparisonButton
        active={false}
        disabled
        onPress={onPress}
        accessibilityLabel="Add to compare"
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Add to compare' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('still toggles off when active even if disabled is passed', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <ComparisonButton
        active
        disabled
        onPress={onPress}
        accessibilityLabel="Remove from compare"
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Remove from compare' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
