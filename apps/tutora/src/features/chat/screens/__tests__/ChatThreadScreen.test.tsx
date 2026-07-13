/**
 * ChatThreadScreen (#47) — renders a thread's messages, marks it read on open,
 * and sends a composed message. The data/mutation hooks are mocked so the test
 * focuses on the screen's wiring.
 */
import { useMarkThreadRead } from '@features/chat/hooks/useMarkThreadRead';
import { useSendMessage } from '@features/chat/hooks/useSendMessage';
import {
  useThreadMessages,
  type UseThreadMessagesResult,
} from '@features/chat/hooks/useThreadMessages';
import type { ChatMessage } from '@features/chat/types';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { ChatThreadScreen } from '../ChatThreadScreen';

jest.mock('@features/chat/hooks/useThreadMessages', () => ({ useThreadMessages: jest.fn() }));
jest.mock('@features/chat/hooks/useSendMessage', () => ({ useSendMessage: jest.fn() }));
jest.mock('@features/chat/hooks/useMarkThreadRead', () => ({ useMarkThreadRead: jest.fn() }));

const mockedMessages = useThreadMessages as jest.MockedFunction<typeof useThreadMessages>;
const mockedSend = useSendMessage as jest.MockedFunction<typeof useSendMessage>;
const mockedMarkRead = useMarkThreadRead as jest.MockedFunction<typeof useMarkThreadRead>;

const incoming: ChatMessage = {
  id: 'm1',
  threadId: 'th1',
  senderId: 'u2',
  body: 'Salam, dərsə hazırsan?',
  readAt: null,
  createdAt: '2026-07-13T10:00:00.000Z',
  isMine: false,
};

function messagesResult(overrides: Partial<UseThreadMessagesResult>): UseThreadMessagesResult {
  return {
    messages: [],
    isLoading: false,
    isError: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    refetch: jest.fn(),
    fetchNextPage: jest.fn(),
    ...overrides,
  };
}

const send = jest.fn();
const retry = jest.fn();
const markRead = jest.fn();

beforeEach(() => {
  send.mockClear();
  retry.mockClear();
  markRead.mockClear();
  mockedSend.mockReturnValue({ send, retry, isSending: false });
  mockedMarkRead.mockReturnValue({ markRead });
});

describe('ChatThreadScreen (#47)', () => {
  it('marks the thread read on open and renders its messages', async () => {
    mockedMessages.mockReturnValue(messagesResult({ messages: [incoming] }));

    await renderWithProviders(<ChatThreadScreen threadId="th1" title="Aygün" onBack={jest.fn()} />);

    expect(markRead).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Salam, dərsə hazırsan?')).toBeOnTheScreen();
  });

  it('sends a composed message', async () => {
    mockedMessages.mockReturnValue(messagesResult({ messages: [incoming] }));

    await renderWithProviders(<ChatThreadScreen threadId="th1" title="Aygün" onBack={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText('Message'), 'Bəli, hazıram');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    expect(send).toHaveBeenCalledWith('Bəli, hazıram');
  });

  it('shows the empty state for a thread with no messages', async () => {
    mockedMessages.mockReturnValue(messagesResult({ messages: [] }));

    await renderWithProviders(<ChatThreadScreen threadId="th1" title="Aygün" onBack={jest.fn()} />);

    expect(screen.getByText('No messages yet')).toBeOnTheScreen();
  });
});
