/**
 * NotificationRow (#50) — renders title/body/timestamp, marks unread for screen
 * readers, and fires onPress.
 */
import type { AppNotification } from '@features/notifications/types';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { NotificationRow } from '../NotificationRow';

const base: AppNotification = {
  id: 'n1',
  type: 'CHAT_MESSAGE',
  title: 'New message',
  body: 'Aygün sent you a message',
  data: { threadId: 't1' },
  isRead: false,
  readAt: null,
  createdAt: '2026-07-10T09:00:00',
};

describe('NotificationRow (#50)', () => {
  it('renders the title and body', async () => {
    await renderWithProviders(<NotificationRow notification={base} onPress={jest.fn()} />);

    expect(screen.getByText('New message')).toBeOnTheScreen();
    expect(screen.getByText('Aygün sent you a message')).toBeOnTheScreen();
  });

  it('marks an unread notification for screen readers', async () => {
    await renderWithProviders(<NotificationRow notification={base} onPress={jest.fn()} />);

    expect(screen.getByLabelText('New message, unread')).toBeOnTheScreen();
  });

  it('drops the unread suffix once read', async () => {
    await renderWithProviders(
      <NotificationRow notification={{ ...base, isRead: true }} onPress={jest.fn()} />,
    );

    expect(screen.getByLabelText('New message')).toBeOnTheScreen();
  });

  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<NotificationRow notification={base} onPress={onPress} />);

    await fireEvent.press(screen.getByLabelText('New message, unread'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
