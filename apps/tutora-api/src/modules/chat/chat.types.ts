import type { UserRole } from '@prisma/client';

/** The other party in a 1:1 thread, resolved relative to the caller. */
export interface ChatCounterpart {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

/** Compact preview of a thread's latest message for the thread list. */
export interface ChatMessagePreview {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
}

export interface ThreadView {
  id: string;
  counterpart: ChatCounterpart;
  lastMessage: ChatMessagePreview | null;
  unreadCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
}

export interface MessageView {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  isMine: boolean;
}

/** Result of a participant check: both user ids plus the resolved counterpart. */
export interface ThreadParticipants {
  threadId: string;
  studentUserId: string;
  tutorUserId: string;
  counterpartUserId: string;
}
