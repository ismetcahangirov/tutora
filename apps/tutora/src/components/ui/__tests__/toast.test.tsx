/**
 * Toast show / queue / hide (issue #13).
 *
 * Auto-dismiss timing depends on Animated completion and is not asserted here;
 * these tests cover the queueing contract, which is the interesting logic.
 */
import { Button, ToastProvider, useToast } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

function ToastHarness() {
  const { show, hide } = useToast();
  return (
    <>
      <Button label="first" onPress={() => show({ message: 'Saved!', type: 'success' })} />
      <Button label="second" onPress={() => show({ message: 'Uploaded!' })} />
      <Button label="next" onPress={hide} />
    </>
  );
}

describe('Toast (#13)', () => {
  it('shows a toast on demand', async () => {
    await renderWithProviders(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('first'));
    expect(screen.getByText('Saved!')).toBeOnTheScreen();
  });

  it('shows one at a time and reveals queued toasts after dismiss', async () => {
    await renderWithProviders(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('first'));
    await fireEvent.press(screen.getByText('second'));

    expect(screen.getByText('Saved!')).toBeOnTheScreen();
    expect(screen.queryByText('Uploaded!')).toBeNull();

    await fireEvent.press(screen.getByText('next'));
    expect(screen.getByText('Uploaded!')).toBeOnTheScreen();
  });
});
