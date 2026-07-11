/**
 * SearchBar clear affordance + debounce (issue #15).
 */
import { SearchBar } from '@/components/ui';
import { act, fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('SearchBar (#15)', () => {
  it('shows the clear button only when there is text and clears it', async () => {
    const onChangeText = jest.fn();
    const { rerender } = await renderWithProviders(
      <SearchBar value="" onChangeText={onChangeText} placeholder="Search tutors" />,
    );

    expect(screen.queryByLabelText('Clear search')).toBeNull();

    await rerender(
      <SearchBar value="calculus" onChangeText={onChangeText} placeholder="Search tutors" />,
    );
    await fireEvent.press(screen.getByLabelText('Clear search'));
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('debounces onDebouncedChange', async () => {
    jest.useFakeTimers();
    const onDebounced = jest.fn();

    await renderWithProviders(
      <SearchBar
        value="calc"
        onChangeText={() => {}}
        onDebouncedChange={onDebounced}
        debounceMs={300}
      />,
    );

    expect(onDebounced).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(onDebounced).toHaveBeenCalledWith('calc');

    jest.useRealTimers();
  });
});
