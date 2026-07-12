import { Prisma, UserRole, type ChatMessage } from '@prisma/client';
import type { MessageView, ThreadView } from './chat.types';

/** Relations loaded for a thread view: both parties' identity + last message. */
export const THREAD_INCLUDE = {
  student: { select: { userId: true, user: { select: { name: true, avatarUrl: true } } } },
  tutor: { select: { userId: true, user: { select: { name: true, avatarUrl: true } } } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.ChatThreadInclude;

export type ThreadWithRelations = Prisma.ChatThreadGetPayload<{ include: typeof THREAD_INCLUDE }>;

/** Projects a thread relative to the caller: the counterpart is the other side. */
export function toThreadView(
  thread: ThreadWithRelations,
  callerUserId: string,
  unreadCount: number,
): ThreadView {
  const isStudent = thread.student.userId === callerUserId;
  const counterpart = isStudent ? thread.tutor : thread.student;
  const last = thread.messages[0] ?? null;
  return {
    id: thread.id,
    counterpart: {
      userId: counterpart.userId,
      name: counterpart.user.name,
      avatarUrl: counterpart.user.avatarUrl,
      role: isStudent ? UserRole.TUTOR : UserRole.STUDENT,
    },
    lastMessage: last
      ? { id: last.id, body: last.body, senderId: last.senderId, createdAt: last.createdAt }
      : null,
    unreadCount,
    lastMessageAt: thread.lastMessageAt,
    createdAt: thread.createdAt,
  };
}

export function toMessageView(message: ChatMessage, callerUserId: string): MessageView {
  return {
    id: message.id,
    threadId: message.threadId,
    senderId: message.senderId,
    body: message.body,
    readAt: message.readAt,
    createdAt: message.createdAt,
    isMine: message.senderId === callerUserId,
  };
}
