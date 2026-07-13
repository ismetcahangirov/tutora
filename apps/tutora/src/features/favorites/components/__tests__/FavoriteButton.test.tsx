/**
 * FavoriteButton (#45) — press wiring and the saved/unsaved accessible state.
 */
import { FavoriteButton } from '../FavoriteButton';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('FavoriteButton (#45)', () => {
  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <FavoriteButton active={false} onPress={onPress} accessibilityLabel="Save" />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the selected state to assistive tech when active', async () => {
    await renderWithProviders(
      <FavoriteButton active onPress={jest.fn()} accessibilityLabel="Saved" />,
    );

    // getByRole with `selected` only matches when the element's a11y state is set.
    expect(screen.getByRole('button', { name: 'Saved', selected: true })).toBeOnTheScreen();
  });
});
