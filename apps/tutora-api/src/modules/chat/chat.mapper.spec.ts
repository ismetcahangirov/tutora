import { UserRole } from '@prisma/client';
import { toMessageView, toThreadView } from './chat.mapper';

const base = {
  id: 'thr1',
  lastMessageAt: new Date('2026-05-01T00:00:00Z'),
  createdAt: new Date('2026-04-01T00:00:00Z'),
  student: { userId: 'stu', user: { name: 'Sam', avatarUrl: null } },
  tutor: { userId: 'tut', user: { name: 'Tia', avatarUrl: 'a.png' } },
  messages: [] as Array<{ id: string; body: string; senderId: string; createdAt: Date }>,
};

describe('toThreadView', () => {
  it('picks the tutor as counterpart when the caller is the student', () => {
    const view = toThreadView(base as never, 'stu', 4);
    expect(view.counterpart).toEqual({
      userId: 'tut',
      name: 'Tia',
      avatarUrl: 'a.png',
      role: UserRole.TUTOR,
    });
    expect(view.unreadCount).toBe(4);
    expect(view.lastMessage).toBeNull();
  });

  it('picks the student as counterpart when the caller is the tutor', () => {
    const view = toThreadView(base as never, 'tut', 0);
    expect(view.counterpart).toMatchObject({ userId: 'stu', role: UserRole.STUDENT });
  });

  it('exposes the latest message as a preview', () => {
    const withMsg = {
      ...base,
      messages: [{ id: 'm1', body: 'hey', senderId: 'tut', createdAt: base.createdAt }],
    };
    const view = toThreadView(withMsg as never, 'stu', 0);
    expect(view.lastMessage).toMatchObject({ id: 'm1', body: 'hey', senderId: 'tut' });
  });
});

describe('toMessageView', () => {
  it('flags isMine relative to the caller', () => {
    const msg = {
      id: 'm1',
      threadId: 'thr1',
      senderId: 'stu',
      body: 'hi',
      readAt: null,
      createdAt: base.createdAt,
    };
    expect(toMessageView(msg as never, 'stu').isMine).toBe(true);
    expect(toMessageView(msg as never, 'tut').isMine).toBe(false);
  });
});
