/**
 * ComparisonBar (#46) — shows a hint until the minimum is met, disables the
 * compare action until then, and wires the compare/clear callbacks.
 */
import { ComparisonBar } from '../ComparisonBar';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('ComparisonBar (#46)', () => {
  it('nudges to pick more and disables compare with only one selected', async () => {
    const onCompare = jest.fn();
    await renderWithProviders(
      <ComparisonBar
        count={1}
        limit={3}
        canCompare={false}
        onCompare={onCompare}
        onClear={jest.fn()}
      />,
    );

    expect(screen.getByText('Pick at least one more to compare')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('comparison-bar-compare'));
    expect(onCompare).not.toHaveBeenCalled();
  });

  it('opens the comparison once enough tutors are selected', async () => {
    const onCompare = jest.fn();
    await renderWithProviders(
      <ComparisonBar count={2} limit={3} canCompare onCompare={onCompare} onClear={jest.fn()} />,
    );

    expect(screen.queryByText('Pick at least one more to compare')).toBeNull();

    await fireEvent.press(screen.getByTestId('comparison-bar-compare'));
    expect(onCompare).toHaveBeenCalledTimes(1);
  });

  it('clears the selection', async () => {
    const onClear = jest.fn();
    await renderWithProviders(
      <ComparisonBar count={2} limit={3} canCompare onCompare={jest.fn()} onClear={onClear} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
