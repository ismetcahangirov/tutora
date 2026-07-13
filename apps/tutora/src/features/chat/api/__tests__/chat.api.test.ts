/**
 * chat API (#47) — the shared client is mocked; we assert the request shape
 * (endpoint + paging params) and the typed responses for every call.
 */
import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';
import { CHAT_ENDPOINTS } from '@features/chat/constants';
import type { ChatMessage, ChatThread } from '@features/chat/types';

import {
  getUnreadCount,
  listMessages,
  listThreads,
  markThreadRead,
  sendMessage,
} from '../chat.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

const thread: ChatThread = {
  id: 'th1',
  counterpart: { userId: 'u2', name: 'Aygün', avatarUrl: null, role: 'TUTOR' },
  lastMessage: { id: 'm1', body: 'Salam', senderId: 'u2', createdAt: '2026-07-13T10:00:00.000Z' },
  unreadCount: 2,
  lastMessageAt: '2026-07-13T10:00:00.000Z',
  createdAt: '2026-07-10T09:00:00.000Z',
};

const message: ChatMessage = {
  id: 'm1',
  threadId: 'th1',
  senderId: 'u2',
  body: 'Salam',
  readAt: null,
  createdAt: '2026-07-13T10:00:00.000Z',
  isMine: false,
};

const threadsPage: Paginated<ChatThread> = {
  data: [thread],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
};

const messagesPage: Paginated<ChatMessage> = {
  data: [message],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
};

beforeEach(() => {
  mockedGet.mockReset();
  mockedPost.mockReset();
});

describe('listThreads', () => {
  it('requests the threads endpoint with paging and returns the envelope', async () => {
    mockedGet.mockResolvedValueOnce({ data: threadsPage });

    await expect(listThreads({ page: 2, limit: 20 })).resolves.toEqual(threadsPage);
    expect(mockedGet).toHaveBeenCalledWith(CHAT_ENDPOINTS.threads, {
      params: { page: 2, limit: 20 },
    });
  });

  it('omits undefined paging params', async () => {
    mockedGet.mockResolvedValueOnce({ data: threadsPage });

    await listThreads({});
    expect(mockedGet).toHaveBeenCalledWith(CHAT_ENDPOINTS.threads, { params: {} });
  });
});

describe('listMessages', () => {
  it("requests a thread's messages with paging", async () => {
    mockedGet.mockResolvedValueOnce({ data: messagesPage });

    await expect(listMessages('th1', { page: 1, limit: 20 })).resolves.toEqual(messagesPage);
    expect(mockedGet).toHaveBeenCalledWith(CHAT_ENDPOINTS.messages('th1'), {
      params: { page: 1, limit: 20 },
    });
  });
});

describe('sendMessage', () => {
  it('posts the trimmed body and returns the created message', async () => {
    mockedPost.mockResolvedValueOnce({ data: message });

    await expect(sendMessage('th1', '  Salam  ')).resolves.toEqual(message);
    expect(mockedPost).toHaveBeenCalledWith(CHAT_ENDPOINTS.messages('th1'), { body: 'Salam' });
  });
});

describe('markThreadRead', () => {
  it('posts to the read endpoint and returns the read count', async () => {
    mockedPost.mockResolvedValueOnce({ data: { readCount: 3 } });

    await expect(markThreadRead('th1')).resolves.toEqual({ readCount: 3 });
    expect(mockedPost).toHaveBeenCalledWith(CHAT_ENDPOINTS.read('th1'));
  });
});

describe('getUnreadCount', () => {
  it('requests the unread-count endpoint', async () => {
    mockedGet.mockResolvedValueOnce({ data: { count: 5 } });

    await expect(getUnreadCount()).resolves.toEqual({ count: 5 });
    expect(mockedGet).toHaveBeenCalledWith(CHAT_ENDPOINTS.unreadCount);
  });
});
