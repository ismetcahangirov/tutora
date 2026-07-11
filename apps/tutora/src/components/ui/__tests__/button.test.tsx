/**
 * Button behavior + accessibility (issue #12).
 */
import { Button } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('Button (#12)', () => {
  it('renders its label and fires onPress', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Continue" onPress={onPress} />);

    await fireEvent.press(screen.getByText('Continue'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire and is disabled when `disabled`', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save" onPress={onPress} disabled />);

    const button = screen.getByRole('button');
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('replaces the label with a spinner and blocks press while loading', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Submit" onPress={onPress} loading />);

    expect(screen.queryByText('Submit')).toBeNull();
    const button = screen.getByRole('button');
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
  });

  it('uses the label as the default accessible name', async () => {
    await renderWithProviders(<Button label="Apply filters" />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Apply filters');
  });
});
