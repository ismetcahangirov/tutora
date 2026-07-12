import {
  DevicePlatform,
  NotificationType,
  type DeviceToken,
  type Notification,
} from '@prisma/client';
import { toDeviceView, toNotificationView } from './notifications.mapper';

describe('toNotificationView', () => {
  const base: Notification = {
    id: 'n1',
    userId: 'u1',
    type: NotificationType.ANNOUNCEMENT,
    title: 'Title',
    body: 'Body',
    data: { url: '/tutors/1' },
    readAt: null,
    createdAt: new Date('2026-06-02T00:00:00Z'),
  };

  it('marks an unread notification and preserves its payload', () => {
    const view = toNotificationView(base);
    expect(view).toMatchObject({ id: 'n1', isRead: false, data: { url: '/tutors/1' } });
  });

  it('derives isRead from readAt', () => {
    const view = toNotificationView({ ...base, readAt: new Date('2026-06-03T00:00:00Z') });
    expect(view.isRead).toBe(true);
  });

  it('normalizes a missing payload to null', () => {
    const view = toNotificationView({ ...base, data: null });
    expect(view.data).toBeNull();
  });
});

describe('toDeviceView', () => {
  it('projects a device without exposing the raw token', () => {
    const row: DeviceToken = {
      id: 'dev1',
      userId: 'u1',
      token: 'secret-token',
      platform: DevicePlatform.IOS,
      lastUsedAt: new Date('2026-06-01T00:00:00Z'),
      createdAt: new Date('2026-05-01T00:00:00Z'),
      updatedAt: new Date('2026-06-01T00:00:00Z'),
    };

    const view = toDeviceView(row);

    expect(view).toEqual({
      id: 'dev1',
      platform: DevicePlatform.IOS,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    });
    expect(JSON.stringify(view)).not.toContain('secret-token');
  });
});
