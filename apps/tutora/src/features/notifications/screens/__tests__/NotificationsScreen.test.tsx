/**
 * NotificationsScreen (#50) — renders the feed / empty state, marks a tapped
 * notification read, deep-links when the payload points somewhere, and marks all
 * read. The hooks + toast are mocked.
 */
import { useToast } from '@/components/ui';
import { useMarkAllNotificationsRead } from '@features/notifications/hooks/useMarkAllNotificationsRead';
import { useMarkNotificationRead } from '@features/notifications/hooks/useMarkNotificationRead';
import {
  useNotifications,
  type UseNotificationsResult,
} from '@features/notifications/hooks/useNotifications';
import type { AppNotification } from '@features/notifications/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils';

import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  useToast: jest.fn(),
}));
jest.mock('@features/notifications/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));
jest.mock('@features/notifications/hooks/useMarkNotificationRead', () => ({
  useMarkNotificationRead: jest.fn(),
}));
jest.mock('@features/notifications/hooks/useMarkAllNotificationsRead', () => ({
  useMarkAllNotificationsRead: jest.fn(),
}));

const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockedUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockedUseMarkRead = useMarkNotificationRead as jest.MockedFunction<
  typeof useMarkNotificationRead
>;
const mockedUseMarkAll = useMarkAllNotificationsRead as jest.MockedFunction<
  typeof useMarkAllNotificationsRead
>;

const chatNotification: AppNotification = {
  id: 'n1',
  type: 'CHAT_MESSAGE',
  title: 'New message',
  body: 'Aygün sent you a message',
  data: { threadId: 't1' },
  isRead: false,
  readAt: null,
  createdAt: '2026-07-10T09:00:00',
};

const systemNotification: AppNotification = {
  id: 'n2',
  type: 'SYSTEM',
  title: 'Welcome',
  body: 'Thanks for joining Tutora',
  data: null,
  isRead: true,
  readAt: '2026-07-09T09:00:00',
  createdAt: '2026-07-09T09:00:00',
};

const show = jest.fn();
const markRead = jest.fn();
const markAll = jest.fn().mockResolvedValue(undefined);

function notificationsResult(overrides: Partial<UseNotificationsResult>): UseNotificationsResult {
  return {
    notifications: [],
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

beforeEach(() => {
  show.mockClear();
  markRead.mockClear();
  markAll.mockClear();
  mockedUseToast.mockReturnValue({ show, hide: jest.fn() });
  mockedUseMarkRead.mockReturnValue({ markRead });
  mockedUseMarkAll.mockReturnValue({ markAll, isPending: false });
});

describe('NotificationsScreen (#50)', () => {
  it('shows the empty state with no notifications', async () => {
    mockedUseNotifications.mockReturnValue(notificationsResult({}));

    await renderWithProviders(<NotificationsScreen onBack={jest.fn()} onOpen={jest.fn()} />);

    expect(screen.getByText('No notifications yet')).toBeOnTheScreen();
  });

  it('shows the error state', async () => {
    mockedUseNotifications.mockReturnValue(notificationsResult({ isError: true }));

    await renderWithProviders(<NotificationsScreen onBack={jest.fn()} onOpen={jest.fn()} />);

    expect(screen.getByText('Couldn’t load notifications.')).toBeOnTheScreen();
  });

  it('marks a tapped notification read and follows its deep-link', async () => {
    mockedUseNotifications.mockReturnValue(
      notificationsResult({ notifications: [chatNotification], total: 1 }),
    );
    const onOpen = jest.fn();

    await renderWithProviders(<NotificationsScreen onBack={jest.fn()} onOpen={onOpen} />);

    await fireEvent.press(screen.getByLabelText('New message, unread'));

    expect(markRead).toHaveBeenCalledWith('n1');
    expect(onOpen).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 't1' } });
  });

  it('does not navigate for a notification without a deep-link target', async () => {
    mockedUseNotifications.mockReturnValue(
      notificationsResult({ notifications: [systemNotification], total: 1 }),
    );
    const onOpen = jest.fn();

    await renderWithProviders(<NotificationsScreen onBack={jest.fn()} onOpen={onOpen} />);

    await fireEvent.press(screen.getByLabelText('Welcome'));

    // Already read → no markRead; no deep-link → no navigation.
    expect(markRead).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('marks all read from the header when there is unread', async () => {
    mockedUseNotifications.mockReturnValue(
      notificationsResult({ notifications: [chatNotification], total: 1 }),
    );

    await renderWithProviders(<NotificationsScreen onBack={jest.fn()} onOpen={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Mark all read' }));

    await waitFor(() => expect(markAll).toHaveBeenCalled());
  });
});
