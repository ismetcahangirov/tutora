/**
 * Input label / value / error behavior (issue #12).
 */
import { Input } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('Input (#12)', () => {
  it('renders its label and reports text changes', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(
      <Input label="Email" value="" onChangeText={onChangeText} placeholder="you@example.com" />,
    );

    expect(screen.getByText('Email')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });

  it('shows the error and hides the helper when in error', async () => {
    await renderWithProviders(
      <Input label="Email" helperText="We never share it" errorText="Email is required" />,
    );

    expect(screen.getByText('Email is required')).toBeOnTheScreen();
    expect(screen.queryByText('We never share it')).toBeNull();
  });

  it('is not editable when disabled', async () => {
    await renderWithProviders(<Input placeholder="Disabled" disabled />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });
});
