/**
 * Notification presentation helpers (#50) — icon mapping + timestamp formatting.
 */
import { formatNotificationTime, iconForNotification } from '../presentation';

describe('iconForNotification', () => {
  it('maps each notification type to its icon', () => {
    expect(iconForNotification('SYSTEM')).toBe('bell');
    expect(iconForNotification('CHAT_MESSAGE')).toBe('message-circle');
    expect(iconForNotification('APPLICATION')).toBe('inbox');
    expect(iconForNotification('REVIEW')).toBe('star');
    expect(iconForNotification('ANNOUNCEMENT')).toBe('award');
  });
});

describe('formatNotificationTime', () => {
  // Local-time dates so the assertions hold regardless of the runner's timezone.
  const now = new Date(2026, 6, 13, 12, 0, 0);

  it('shows the time for a notification from today', () => {
    const today = new Date(2026, 6, 13, 9, 5, 0);
    expect(formatNotificationTime(today.toISOString(), now)).toBe('09:05');
  });

  it('shows a short date for an older notification', () => {
    const older = new Date(2026, 6, 10, 9, 0, 0);
    expect(formatNotificationTime(older.toISOString(), now)).toBe('10.7.2026');
  });

  it('returns an empty string for an unparseable timestamp', () => {
    expect(formatNotificationTime('not-a-date', now)).toBe('');
  });
});
