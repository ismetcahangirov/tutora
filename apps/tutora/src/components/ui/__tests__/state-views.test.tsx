/**
 * Loading / empty / error states (issue #14).
 */
import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('state views (#14)', () => {
  it('EmptyState renders its copy and triggers the action', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <EmptyState
        title="No tutors yet"
        description="Try widening your filters"
        actionLabel="Reset filters"
        onAction={onAction}
      />,
    );

    expect(screen.getByText('No tutors yet')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Reset filters'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('ErrorState renders a retry action', async () => {
    const onRetry = jest.fn();
    await renderWithProviders(
      <ErrorState description="Network error" retryLabel="Retry" onRetry={onRetry} />,
    );

    await fireEvent.press(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('LoadingState announces a loading label', async () => {
    await renderWithProviders(<LoadingState label="Loading tutors" />);
    expect(screen.getByText('Loading tutors')).toBeOnTheScreen();
  });
});
