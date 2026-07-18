import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { UpdatePromptModal } from '../UpdatePromptModal';

// `renderWithProviders` defaults to the app's default locale ('az', per
// DEFAULT_LANGUAGE) — pass `language: 'en'` explicitly so these assertions
// don't depend on that default, matching the convention in
// shared/i18n/__tests__/i18n.test.tsx.
describe('UpdatePromptModal', () => {
  it('renders nothing when idle', async () => {
    await renderWithProviders(
      <UpdatePromptModal
        status="idle"
        downloadProgress={undefined}
        onApply={jest.fn()}
        onDismiss={jest.fn()}
      />,
      { language: 'en' },
    );
    expect(screen.queryByText('Update available')).toBeNull();
  });

  it('shows the prompt with both actions when available', async () => {
    const onApply = jest.fn();
    const onDismiss = jest.fn();
    await renderWithProviders(
      <UpdatePromptModal
        status="available"
        downloadProgress={undefined}
        onApply={onApply}
        onDismiss={onDismiss}
      />,
      { language: 'en' },
    );

    expect(screen.getByText('Update available')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Update now'));
    expect(onApply).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText('Later'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows a progress bar while downloading', async () => {
    await renderWithProviders(
      <UpdatePromptModal
        status="downloading"
        downloadProgress={0.42}
        onApply={jest.fn()}
        onDismiss={jest.fn()}
      />,
      { language: 'en' },
    );

    expect(screen.getByText('Downloading...')).toBeOnTheScreen();
    // Accessibility label includes the literal "..." from the translation string.
    expect(screen.getByLabelText('Downloading..., 42%')).toBeOnTheScreen();
  });

  it('shows a branded full-screen message while restarting', async () => {
    await renderWithProviders(
      <UpdatePromptModal
        status="restarting"
        downloadProgress={1}
        onApply={jest.fn()}
        onDismiss={jest.fn()}
      />,
      { language: 'en' },
    );

    expect(screen.getByText('Restarting...')).toBeOnTheScreen();
  });
});
