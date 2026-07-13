/**
 * MessageBubble (#47) — renders the body and, for a failed outgoing message,
 * becomes a retry button that re-sends it.
 */
import type { ChatMessage } from '@features/chat/types';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { MessageBubble } from '../MessageBubble';

const base: ChatMessage = {
  id: 'm1',
  threadId: 'th1',
  senderId: 'me',
  body: 'Salam!',
  readAt: null,
  createdAt: '2026-07-13T10:00:00.000Z',
  isMine: true,
};

describe('MessageBubble (#47)', () => {
  it('renders the message body', async () => {
    await renderWithProviders(<MessageBubble message={base} onRetry={jest.fn()} />);
    expect(screen.getByText('Salam!')).toBeOnTheScreen();
  });

  it('retries a failed message on press', async () => {
    const failed: ChatMessage = { ...base, deliveryStatus: 'failed' };
    const onRetry = jest.fn();

    await renderWithProviders(<MessageBubble message={failed} onRetry={onRetry} />);

    await fireEvent.press(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledWith(failed);
  });

  it('is not a button when delivered', async () => {
    await renderWithProviders(<MessageBubble message={base} onRetry={jest.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
