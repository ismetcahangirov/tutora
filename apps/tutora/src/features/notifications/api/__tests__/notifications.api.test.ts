/**
 * notifications API (#50) — the shared client is mocked; we assert the request
 * shape (endpoint + params/body) and the typed responses for every call.
 */
import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';
import { NOTIFICATION_ENDPOINTS } from '@features/notifications/constants';
import type { AppNotification, RegisteredDevice } from '@features/notifications/types';

import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerDevice,
} from '../notifications.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

const notification: AppNotification = {
  id: 'n1',
  type: 'CHAT_MESSAGE',
  title: 'New message',
  body: 'Aygün sent you a message',
  data: { threadId: 't1' },
  isRead: false,
  readAt: null,
  createdAt: '2026-07-13T10:00:00.000Z',
};

const device: RegisteredDevice = {
  id: 'd1',
  platform: 'ANDROID',
  lastUsedAt: '2026-07-13T10:00:00.000Z',
  createdAt: '2026-07-13T10:00:00.000Z',
};

const page: Paginated<AppNotification> = {
  data: [notification],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
};

beforeEach(() => {
  mockedGet.mockReset();
  mockedPost.mockReset();
});

describe('listNotifications', () => {
  it('requests the feed with the default page size and returns the envelope', async () => {
    mockedGet.mockResolvedValueOnce({ data: page });

    await expect(listNotifications({ page: 1 })).resolves.toEqual(page);
    expect(mockedGet).toHaveBeenCalledWith(NOTIFICATION_ENDPOINTS.root, {
      params: { limit: 20, page: 1 },
    });
  });

  it('includes unreadOnly only when true', async () => {
    mockedGet.mockResolvedValueOnce({ data: page });

    await listNotifications({ page: 2, limit: 10, unreadOnly: true });
    expect(mockedGet).toHaveBeenCalledWith(NOTIFICATION_ENDPOINTS.root, {
      params: { limit: 10, page: 2, unreadOnly: true },
    });
  });
});

describe('getUnreadCount', () => {
  it('requests the unread-count endpoint', async () => {
    mockedGet.mockResolvedValueOnce({ data: { count: 4 } });

    await expect(getUnreadCount()).resolves.toEqual({ count: 4 });
    expect(mockedGet).toHaveBeenCalledWith(NOTIFICATION_ENDPOINTS.unreadCount);
  });
});

describe('markNotificationRead', () => {
  it('posts to the per-notification read endpoint and returns the record', async () => {
    mockedPost.mockResolvedValueOnce({ data: { ...notification, isRead: true } });

    await expect(markNotificationRead('n1')).resolves.toEqual({ ...notification, isRead: true });
    expect(mockedPost).toHaveBeenCalledWith(NOTIFICATION_ENDPOINTS.read('n1'));
  });
});

describe('markAllNotificationsRead', () => {
  it('posts to read-all and returns the read count', async () => {
    mockedPost.mockResolvedValueOnce({ data: { readCount: 3 } });

    await expect(markAllNotificationsRead()).resolves.toEqual({ readCount: 3 });
    expect(mockedPost).toHaveBeenCalledWith(NOTIFICATION_ENDPOINTS.readAll);
  });
});

describe('registerDevice', () => {
  it('posts the token + platform and returns the device view', async () => {
    mockedPost.mockResolvedValueOnce({ data: device });

    await expect(registerDevice({ token: 'abc', platform: 'ANDROID' })).resolves.toEqual(device);
    expect(mockedPost).toHaveBeenCalledWith(NOTIFICATION_ENDPOINTS.devices, {
      token: 'abc',
      platform: 'ANDROID',
    });
  });
});
