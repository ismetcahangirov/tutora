/**
 * MessagesScreen (#47) — renders the thread list, its empty and error states,
 * and hands the tapped thread up to the router. The data hook is mocked.
 */
import { useThreads, type UseThreadsResult } from '@features/chat/hooks/useThreads';
import type { ChatThread } from '@features/chat/types';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { MessagesScreen } from '../MessagesScreen';

jest.mock('@features/chat/hooks/useThreads', () => ({ useThreads: jest.fn() }));
const mockedUseThreads = useThreads as jest.MockedFunction<typeof useThreads>;

const thread: ChatThread = {
  id: 'th1',
  counterpart: { userId: 'u2', name: 'Aygün Məmmədova', avatarUrl: null, role: 'TUTOR' },
  lastMessage: {
    id: 'm1',
    body: 'See you at 5',
    senderId: 'u2',
    createdAt: '2026-07-13T10:00:00.000Z',
  },
  unreadCount: 2,
  lastMessageAt: '2026-07-13T10:00:00.000Z',
  createdAt: '2026-07-10T09:00:00.000Z',
};

function result(overrides: Partial<UseThreadsResult>): UseThreadsResult {
  return {
    threads: [],
    total: 0,
    isLoading: false,
    isError: false,
    isRefetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    refetch: jest.fn(),
    fetchNextPage: jest.fn(),
    ...overrides,
  };
}

describe('MessagesScreen (#47)', () => {
  it('shows the empty state when there are no threads', async () => {
    mockedUseThreads.mockReturnValue(result({}));

    await renderWithProviders(<MessagesScreen onOpenThread={jest.fn()} />);

    expect(screen.getByText('No conversations yet')).toBeOnTheScreen();
  });

  it('renders threads and opens one on press', async () => {
    mockedUseThreads.mockReturnValue(result({ threads: [thread], total: 1 }));
    const onOpenThread = jest.fn();

    await renderWithProviders(<MessagesScreen onOpenThread={onOpenThread} />);

    expect(screen.getByText('See you at 5')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /Aygün Məmmədova/ }));
    expect(onOpenThread).toHaveBeenCalledWith(thread);
  });

  it('shows an error state with retry', async () => {
    const refetch = jest.fn();
    mockedUseThreads.mockReturnValue(result({ isError: true, refetch }));

    await renderWithProviders(<MessagesScreen onOpenThread={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
