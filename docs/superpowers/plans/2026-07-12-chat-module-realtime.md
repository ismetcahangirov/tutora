# Chat Module (Realtime) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the realtime student↔tutor chat module (#34) for `tutora-api`: REST endpoints for threads/messages/read/unread plus a Socket.io gateway for live message delivery, read receipts, typing and presence.

**Architecture:** All persistence and authorization live in `ChatService` (Prisma), exactly like `reviews`/`applications`. The `ChatGateway` (Socket.io, namespace `/chat`) is a fan-out layer; the service emits through a thin `ChatRealtime` holder so it never depends on the gateway (no DI cycle). Typing and presence are ephemeral, in-memory only. A thread may be opened only between a student and tutor who already have an `Application` between them.

**Tech Stack:** NestJS 11, Prisma 6, `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io`, Jest + ts-jest.

**Conventions (already verified in the codebase):**

- Guards: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`; principal via `@CurrentUser()` (`AuthenticatedUser`).
- Pagination: `PaginationQueryDto` (`page`/`limit`/`skip`) + `buildPage` → `Paginated<T>`.
- Business errors: plain NestJS exceptions with English messages. i18n only for DTO validation via `i18nValidationMessage('validation.common.*')`.
- `PrismaModule` is `@Global()`; `ConfigModule` is global. A feature module only needs `imports: [AuthModule]` to get `JwtService` + the guards.
- Path aliases: `@/*` → `src/*`, `@common/*`, `@modules/*`, `@config/*`.

**Run commands (pnpm workspace; package name `@tutora/api`):**

- Single test file: `pnpm --filter @tutora/api test <pattern>`
- Typecheck: `pnpm --filter @tutora/api typecheck`
- Lint: `pnpm --filter @tutora/api lint`
- All tests: `pnpm --filter @tutora/api test`

---

## File Structure

```
apps/tutora-api/src/modules/chat/
├── dto/
│   ├── start-thread.dto.ts       # { tutorId? , studentId? } role-aware
│   ├── send-message.dto.ts       # { body }
│   ├── list-threads-query.dto.ts # extends PaginationQueryDto
│   └── list-messages-query.dto.ts# extends PaginationQueryDto
├── chat.events.ts        # event names, room helpers, WS payload types
├── chat.types.ts         # ThreadView, MessageView, ThreadParticipants
├── chat.presence.ts      # in-memory online tracker  (+ .spec.ts)
├── chat.mapper.ts        # THREAD_INCLUDE, toThreadView, toMessageView (+ .spec.ts)
├── chat.realtime.ts      # holds socket.io Server + emit helpers (+ .spec.ts)
├── chat.service.ts       # REST/business logic + Prisma (+ .spec.ts)
├── chat.gateway.ts       # Socket.io gateway (+ .spec.ts)
├── chat.controller.ts    # REST endpoints
└── chat.module.ts        # wires the module
```

Plus modify `apps/tutora-api/package.json` (deps) and `apps/tutora-api/src/app.module.ts` (register `ChatModule`).

---

## Task 1: Add Socket.io dependencies

**Files:**

- Modify: `apps/tutora-api/package.json` (dependencies)

- [ ] **Step 1: Install the three packages**

Run:

```bash
pnpm --filter @tutora/api add @nestjs/websockets@^11.0.1 @nestjs/platform-socket.io@^11.0.1 socket.io@^4.8.1
```

- [ ] **Step 2: Verify install & typecheck still passes**

Run: `pnpm --filter @tutora/api typecheck`
Expected: exits 0 (no source changes yet).

- [ ] **Step 3: Commit**

```bash
git add apps/tutora-api/package.json pnpm-lock.yaml
git commit -m "build(api): add socket.io deps for chat gateway (#34)"
```

---

## Task 2: Event constants, room helpers & view types

No behaviour yet — pure declarations consumed by later tasks.

**Files:**

- Create: `apps/tutora-api/src/modules/chat/chat.events.ts`
- Create: `apps/tutora-api/src/modules/chat/chat.types.ts`

- [ ] **Step 1: Write `chat.events.ts`**

```typescript
/** Socket.io namespace, room helpers and event contract for chat (#34). */

export const CHAT_NAMESPACE = '/chat';
export const THREAD_ROOM_PREFIX = 'thread:';
export const USER_ROOM_PREFIX = 'user:';

/** Room every participant of a thread joins to receive its live events. */
export const threadRoom = (threadId: string): string => `${THREAD_ROOM_PREFIX}${threadId}`;
/** Personal room a connected user joins for cross-thread notifications. */
export const userRoom = (userId: string): string => `${USER_ROOM_PREFIX}${userId}`;

export const CHAT_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  TYPING: 'typing',
  PRESENCE: 'presence',
  THREAD_JOIN: 'thread:join',
  THREAD_LEAVE: 'thread:leave',
} as const;

export interface ReadReceipt {
  threadId: string;
  readerUserId: string;
  readAt: Date;
}

export interface PresenceEvent {
  userId: string;
  status: 'online' | 'offline';
}

export interface TypingEvent {
  threadId: string;
  userId: string;
  isTyping: boolean;
}
```

- [ ] **Step 2: Write `chat.types.ts`**

```typescript
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
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @tutora/api typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/tutora-api/src/modules/chat/chat.events.ts apps/tutora-api/src/modules/chat/chat.types.ts
git commit -m "feat(api): chat event contract and view types (#34)"
```

---

## Task 3: ChatPresenceService (in-memory online tracker)

**Files:**

- Create: `apps/tutora-api/src/modules/chat/chat.presence.ts`
- Test: `apps/tutora-api/src/modules/chat/chat.presence.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { ChatPresenceService } from './chat.presence';

describe('ChatPresenceService', () => {
  it('reports a user online after adding a socket', () => {
    const presence = new ChatPresenceService();
    presence.add('u1', 's1');
    expect(presence.isOnline('u1')).toBe(true);
  });

  it('stays online while any socket remains', () => {
    const presence = new ChatPresenceService();
    presence.add('u1', 's1');
    presence.add('u1', 's2');
    expect(presence.remove('u1', 's1')).toBe(false);
    expect(presence.isOnline('u1')).toBe(true);
  });

  it('returns true on the last socket removal and marks the user offline', () => {
    const presence = new ChatPresenceService();
    presence.add('u1', 's1');
    expect(presence.remove('u1', 's1')).toBe(true);
    expect(presence.isOnline('u1')).toBe(false);
  });

  it('is a no-op when removing an unknown user', () => {
    const presence = new ChatPresenceService();
    expect(presence.remove('ghost', 's1')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api test chat.presence`
Expected: FAIL — cannot find module `./chat.presence`.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Injectable } from '@nestjs/common';

/**
 * In-memory online-presence tracker. Maps a user to the set of live socket ids
 * they hold (a user may have multiple devices/tabs). Single-instance only —
 * horizontal scaling requires the socket.io Redis adapter (see the spec).
 */
@Injectable()
export class ChatPresenceService {
  private readonly sockets = new Map<string, Set<string>>();

  /** Registers a live socket for a user. */
  add(userId: string, socketId: string): void {
    const set = this.sockets.get(userId) ?? new Set<string>();
    set.add(socketId);
    this.sockets.set(userId, set);
  }

  /**
   * Removes a socket for a user. Returns true when it was the user's last
   * socket (i.e. the user just went offline).
   */
  remove(userId: string, socketId: string): boolean {
    const set = this.sockets.get(userId);
    if (!set) {
      return false;
    }
    set.delete(socketId);
    if (set.size === 0) {
      this.sockets.delete(userId);
      return true;
    }
    return false;
  }

  isOnline(userId: string): boolean {
    return this.sockets.has(userId);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api test chat.presence`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/chat/chat.presence.ts apps/tutora-api/src/modules/chat/chat.presence.spec.ts
git commit -m "feat(api): in-memory chat presence tracker (#34)"
```

---

## Task 4: ChatMapper (Prisma rows → views)

**Files:**

- Create: `apps/tutora-api/src/modules/chat/chat.mapper.ts`
- Test: `apps/tutora-api/src/modules/chat/chat.mapper.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api test chat.mapper`
Expected: FAIL — cannot find module `./chat.mapper`.

- [ ] **Step 3: Write minimal implementation**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api test chat.mapper`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/chat/chat.mapper.ts apps/tutora-api/src/modules/chat/chat.mapper.spec.ts
git commit -m "feat(api): chat view mappers (#34)"
```

---

## Task 5: DTOs

Validation is enforced by the global `ValidationPipe`; these compile-and-wire only.

**Files:**

- Create: `apps/tutora-api/src/modules/chat/dto/start-thread.dto.ts`
- Create: `apps/tutora-api/src/modules/chat/dto/send-message.dto.ts`
- Create: `apps/tutora-api/src/modules/chat/dto/list-threads-query.dto.ts`
- Create: `apps/tutora-api/src/modules/chat/dto/list-messages-query.dto.ts`

- [ ] **Step 1: Write `start-thread.dto.ts`**

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on a cuid-ish id, matching the other DTOs in this codebase. */
const ID_MAX_LENGTH = 60;

/**
 * Body of `POST /api/v1/chat/threads`. Role-aware: a STUDENT supplies the
 * `tutorId` (TutorProfile id), a TUTOR supplies the `studentId` (StudentProfile
 * id). The service derives the caller's own side and enforces the rule.
 */
export class StartThreadDto {
  @ApiPropertyOptional({ description: 'TutorProfile id — required when the caller is a student.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(ID_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  tutorId?: string;

  @ApiPropertyOptional({ description: 'StudentProfile id — required when the caller is a tutor.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(ID_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  studentId?: string;
}
```

- [ ] **Step 2: Write `send-message.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on a single chat message body. */
export const MESSAGE_MAX_LENGTH = 4000;

/** Body of `POST /api/v1/chat/threads/:id/messages`. */
export class SendMessageDto {
  @ApiProperty({ maxLength: MESSAGE_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.common.notEmpty') })
  @MaxLength(MESSAGE_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  body!: string;
}
```

- [ ] **Step 3: Write `list-threads-query.dto.ts`**

```typescript
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/** Query for `GET /api/v1/chat/threads`. Pagination only for now. */
export class ListThreadsQueryDto extends PaginationQueryDto {}
```

- [ ] **Step 4: Write `list-messages-query.dto.ts`**

```typescript
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/** Query for `GET /api/v1/chat/threads/:id/messages`. Pagination only for now. */
export class ListMessagesQueryDto extends PaginationQueryDto {}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @tutora/api typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/tutora-api/src/modules/chat/dto
git commit -m "feat(api): chat DTOs (#34)"
```

---

## Task 6: ChatRealtime (server holder + emit helpers)

**Files:**

- Create: `apps/tutora-api/src/modules/chat/chat.realtime.ts`
- Test: `apps/tutora-api/src/modules/chat/chat.realtime.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import type { Server } from 'socket.io';
import { CHAT_EVENTS, threadRoom, userRoom } from './chat.events';
import { ChatRealtime } from './chat.realtime';
import type { MessageView } from './chat.types';

function buildServerMock() {
  const emit = jest.fn();
  const chain: { emit: jest.Mock; to: jest.Mock } = { emit, to: jest.fn() };
  chain.to.mockReturnValue(chain);
  const server = { to: jest.fn().mockReturnValue(chain) } as unknown as Server;
  return { server, chain, emit };
}

const message = { id: 'm1', threadId: 't1', senderId: 'u1', isMine: true } as MessageView;

describe('ChatRealtime', () => {
  it('does nothing before a server is bound', () => {
    const realtime = new ChatRealtime();
    expect(() => realtime.emitNewMessage(message, 'u2')).not.toThrow();
  });

  it('emits a new message to the thread room and the recipient room', () => {
    const { server, chain, emit } = buildServerMock();
    const realtime = new ChatRealtime();
    realtime.bind(server);

    realtime.emitNewMessage(message, 'u2');

    expect(server.to).toHaveBeenCalledWith(threadRoom('t1'));
    expect(chain.to).toHaveBeenCalledWith(userRoom('u2'));
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.MESSAGE_NEW, message);
  });

  it('emits a read receipt to the thread room', () => {
    const { server, emit } = buildServerMock();
    const realtime = new ChatRealtime();
    realtime.bind(server);
    const receipt = {
      threadId: 't1',
      readerUserId: 'u1',
      readAt: new Date('2026-05-02T00:00:00Z'),
    };

    realtime.emitRead(receipt);

    expect(server.to).toHaveBeenCalledWith(threadRoom('t1'));
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.MESSAGE_READ, receipt);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api test chat.realtime`
Expected: FAIL — cannot find module `./chat.realtime`.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import { CHAT_EVENTS, threadRoom, userRoom, type ReadReceipt } from './chat.events';
import type { MessageView } from './chat.types';

/**
 * Thin holder of the live socket.io Server plus typed emit helpers. The gateway
 * binds the server in `afterInit`; the service emits through this indirection so
 * it never depends on the gateway directly (breaks the DI cycle). All emits are
 * no-ops until a server is bound.
 */
@Injectable()
export class ChatRealtime {
  private server: Server | null = null;

  bind(server: Server): void {
    this.server = server;
  }

  /**
   * Delivers a new message to everyone viewing the thread and to the recipient's
   * personal room (for an unopened-thread badge). Chaining rooms unions them, so
   * a socket in both receives the event exactly once.
   */
  emitNewMessage(message: MessageView, recipientUserId: string): void {
    this.server
      ?.to(threadRoom(message.threadId))
      .to(userRoom(recipientUserId))
      .emit(CHAT_EVENTS.MESSAGE_NEW, message);
  }

  emitRead(receipt: ReadReceipt): void {
    this.server?.to(threadRoom(receipt.threadId)).emit(CHAT_EVENTS.MESSAGE_READ, receipt);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api test chat.realtime`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/chat/chat.realtime.ts apps/tutora-api/src/modules/chat/chat.realtime.spec.ts
git commit -m "feat(api): chat realtime emitter (#34)"
```

---

## Task 7: ChatService (threads, messages, read, unread)

**Files:**

- Create: `apps/tutora-api/src/modules/chat/chat.service.ts`
- Test: `apps/tutora-api/src/modules/chat/chat.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { ChatRealtime } from './chat.realtime';
import { ChatService } from './chat.service';

function studentUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'stuUser',
    email: 's@t.co',
    role: UserRole.STUDENT,
    onboardingCompleted: true,
    ...overrides,
  };
}
function tutorUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'tutUser',
    email: 't@t.co',
    role: UserRole.TUTOR,
    onboardingCompleted: true,
    ...overrides,
  };
}

function threadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'thr1',
    lastMessageAt: new Date('2026-05-01T00:00:00Z'),
    createdAt: new Date('2026-04-01T00:00:00Z'),
    student: { userId: 'stuUser', user: { name: 'Sam', avatarUrl: null } },
    tutor: { userId: 'tutUser', user: { name: 'Tia', avatarUrl: null } },
    messages: [],
    ...overrides,
  };
}

const participants = { id: 'thr1', student: { userId: 'stuUser' }, tutor: { userId: 'tutUser' } };

function buildPrismaMock() {
  const prisma = {
    studentProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'sp1' }), create: jest.fn() },
    tutorProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'tp1' }) },
    application: { findFirst: jest.fn().mockResolvedValue({ id: 'app1' }) },
    chatThread: {
      upsert: jest.fn().mockResolvedValue(threadRow()),
      findUnique: jest.fn().mockResolvedValue(participants),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
  );
  return prisma;
}

function buildRealtimeMock(): ChatRealtime {
  return {
    emitNewMessage: jest.fn(),
    emitRead: jest.fn(),
    bind: jest.fn(),
  } as unknown as ChatRealtime;
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>, realtime: ChatRealtime) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      ChatService,
      { provide: PrismaService, useValue: prisma },
      { provide: ChatRealtime, useValue: realtime },
    ],
  }).compile();
  return moduleRef.get(ChatService);
}

function page(overrides: Partial<PaginationQueryDto> = {}): PaginationQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

describe('ChatService.openThread', () => {
  it('opens a thread for a student who has an application with the tutor', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma, buildRealtimeMock());

    const result = await service.openThread(studentUser(), { tutorId: 'tp1' });

    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { studentId: 'sp1', tutorId: 'tp1' },
      select: { id: true },
    });
    expect(prisma.chatThread.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId_tutorId: { studentId: 'sp1', tutorId: 'tp1' } },
        create: { studentId: 'sp1', tutorId: 'tp1' },
      }),
    );
    expect(result.counterpart).toMatchObject({ userId: 'tutUser', role: UserRole.TUTOR });
  });

  it('rejects a student who did not supply a tutorId', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma, buildRealtimeMock());
    await expect(service.openThread(studentUser(), {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids opening a thread without an application', async () => {
    const prisma = buildPrismaMock();
    prisma.application.findFirst.mockResolvedValueOnce(null);
    const service = await buildService(prisma, buildRealtimeMock());
    await expect(service.openThread(studentUser(), { tutorId: 'tp1' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.chatThread.upsert).not.toHaveBeenCalled();
  });

  it('opens a thread for a tutor using the student profile id', async () => {
    const prisma = buildPrismaMock();
    const service = await buildService(prisma, buildRealtimeMock());

    await service.openThread(tutorUser(), { studentId: 'sp1' });

    expect(prisma.application.findFirst).toHaveBeenCalledWith({
      where: { studentId: 'sp1', tutorId: 'tp1' },
      select: { id: true },
    });
  });
});

describe('ChatService.listThreads', () => {
  it('lists a student’s threads with unread counts', async () => {
    const prisma = buildPrismaMock();
    prisma.chatThread.findMany.mockResolvedValueOnce([threadRow()]);
    prisma.chatThread.count.mockResolvedValueOnce(1);
    prisma.chatMessage.groupBy.mockResolvedValueOnce([{ threadId: 'thr1', _count: { _all: 2 } }]);
    const service = await buildService(prisma, buildRealtimeMock());

    const result = await service.listThreads(studentUser(), page());

    expect(prisma.chatThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 'sp1' } }),
    );
    expect(result.data[0]).toMatchObject({ id: 'thr1', unreadCount: 2 });
    expect(result.meta.total).toBe(1);
  });

  it('returns an empty page for a tutor with no profile', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(null);
    const service = await buildService(prisma, buildRealtimeMock());

    const result = await service.listThreads(tutorUser(), page());

    expect(result.data).toEqual([]);
    expect(prisma.chatThread.findMany).not.toHaveBeenCalled();
  });
});

describe('ChatService.listMessages', () => {
  it('returns messages newest-first for a participant', async () => {
    const prisma = buildPrismaMock();
    prisma.chatMessage.findMany.mockResolvedValueOnce([
      {
        id: 'm1',
        threadId: 'thr1',
        senderId: 'tutUser',
        body: 'yo',
        readAt: null,
        createdAt: new Date(),
      },
    ]);
    prisma.chatMessage.count.mockResolvedValueOnce(1);
    const service = await buildService(prisma, buildRealtimeMock());

    const result = await service.listMessages(studentUser(), 'thr1', page());

    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { threadId: 'thr1' }, orderBy: { createdAt: 'desc' } }),
    );
    expect(result.data[0]).toMatchObject({ id: 'm1', isMine: false });
  });
});

describe('ChatService.sendMessage', () => {
  it('persists the message, bumps lastMessageAt and broadcasts it', async () => {
    const prisma = buildPrismaMock();
    const created = {
      id: 'msg1',
      threadId: 'thr1',
      senderId: 'stuUser',
      body: 'hi',
      readAt: null,
      createdAt: new Date('2026-05-02T00:00:00Z'),
    };
    prisma.chatMessage.create.mockResolvedValueOnce(created);
    const realtime = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.sendMessage(studentUser(), 'thr1', { body: 'hi' });

    expect(prisma.chatMessage.create).toHaveBeenCalledWith({
      data: { threadId: 'thr1', senderId: 'stuUser', body: 'hi' },
    });
    expect(prisma.chatThread.update).toHaveBeenCalledWith({
      where: { id: 'thr1' },
      data: { lastMessageAt: created.createdAt },
    });
    expect(realtime.emitNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'msg1', isMine: true }),
      'tutUser',
    );
    expect(result).toMatchObject({ id: 'msg1', isMine: true });
  });

  it('rejects a non-participant with NotFound', async () => {
    const prisma = buildPrismaMock();
    prisma.chatThread.findUnique.mockResolvedValueOnce({
      id: 'thr1',
      student: { userId: 'other1' },
      tutor: { userId: 'other2' },
    });
    const service = await buildService(prisma, buildRealtimeMock());
    await expect(service.sendMessage(studentUser(), 'thr1', { body: 'hi' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.chatMessage.create).not.toHaveBeenCalled();
  });

  it('rejects sending to a missing thread', async () => {
    const prisma = buildPrismaMock();
    prisma.chatThread.findUnique.mockResolvedValueOnce(null);
    const service = await buildService(prisma, buildRealtimeMock());
    await expect(service.sendMessage(studentUser(), 'nope', { body: 'hi' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('ChatService.markRead', () => {
  it('marks the counterparty’s unread messages and emits a receipt', async () => {
    const prisma = buildPrismaMock();
    prisma.chatMessage.updateMany.mockResolvedValueOnce({ count: 3 });
    const realtime = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    const result = await service.markRead(studentUser(), 'thr1');

    expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { threadId: 'thr1', senderId: { not: 'stuUser' }, readAt: null },
      }),
    );
    expect(realtime.emitRead).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: 'thr1', readerUserId: 'stuUser' }),
    );
    expect(result).toEqual({ readCount: 3 });
  });

  it('does not emit a receipt when nothing was unread', async () => {
    const prisma = buildPrismaMock();
    prisma.chatMessage.updateMany.mockResolvedValueOnce({ count: 0 });
    const realtime = buildRealtimeMock();
    const service = await buildService(prisma, realtime);

    await service.markRead(studentUser(), 'thr1');

    expect(realtime.emitRead).not.toHaveBeenCalled();
  });
});

describe('ChatService.unreadCount', () => {
  it('counts unread messages across the student’s threads', async () => {
    const prisma = buildPrismaMock();
    prisma.chatMessage.count.mockResolvedValueOnce(5);
    const service = await buildService(prisma, buildRealtimeMock());

    const result = await service.unreadCount(studentUser());

    expect(prisma.chatMessage.count).toHaveBeenCalledWith({
      where: { senderId: { not: 'stuUser' }, readAt: null, thread: { studentId: 'sp1' } },
    });
    expect(result).toEqual({ count: 5 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api test chat.service`
Expected: FAIL — cannot find module `./chat.service`.

- [ ] **Step 3: Write minimal implementation**

```typescript
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { THREAD_INCLUDE, toMessageView, toThreadView } from './chat.mapper';
import { ChatRealtime } from './chat.realtime';
import type { MessageView, ThreadParticipants, ThreadView } from './chat.types';
import type { SendMessageDto } from './dto/send-message.dto';
import type { StartThreadDto } from './dto/start-thread.dto';

/**
 * Realtime 1:1 chat between a student and a tutor (#34). All persistence and
 * authorization live here; the ChatGateway only fans out the results. A thread
 * may be opened only between a student and a tutor who already have an
 * application between them.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: ChatRealtime,
  ) {}

  /**
   * Opens (or returns the existing) thread with the counterparty. The caller
   * supplies the counterparty's profile id for their role; the other side is
   * derived from the caller. Requires an application between the pair.
   */
  async openThread(user: AuthenticatedUser, dto: StartThreadDto): Promise<ThreadView> {
    const { studentId, tutorId } = await this.resolvePair(user, dto);

    const application = await this.prisma.application.findFirst({
      where: { studentId, tutorId },
      select: { id: true },
    });
    if (!application) {
      throw new ForbiddenException('You can only message someone you have an application with');
    }

    const thread = await this.prisma.chatThread.upsert({
      where: { studentId_tutorId: { studentId, tutorId } },
      create: { studentId, tutorId },
      update: {},
      include: THREAD_INCLUDE,
    });
    const unreadCount = await this.countUnread(thread.id, user.id);
    return toThreadView(thread, user.id, unreadCount);
  }

  /** The caller's threads, most-recently-active first, each with an unread count. */
  async listThreads(
    user: AuthenticatedUser,
    query: PaginationQueryDto,
  ): Promise<Paginated<ThreadView>> {
    const where = await this.threadScope(user);
    if (!where) {
      return buildPage([], 0, query.page, query.limit);
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.chatThread.findMany({
        where,
        include: THREAD_INCLUDE,
        orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.chatThread.count({ where }),
    ]);

    const unreadByThread = await this.unreadCountsFor(
      rows.map((row) => row.id),
      user.id,
    );
    const data = rows.map((row) => toThreadView(row, user.id, unreadByThread.get(row.id) ?? 0));
    return buildPage(data, total, query.page, query.limit);
  }

  /** Paginated message history for a thread the caller participates in. */
  async listMessages(
    user: AuthenticatedUser,
    threadId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<MessageView>> {
    await this.assertParticipant(user.id, threadId);
    const where: Prisma.ChatMessageWhereInput = { threadId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.chatMessage.count({ where }),
    ]);
    return buildPage(
      rows.map((row) => toMessageView(row, user.id)),
      total,
      query.page,
      query.limit,
    );
  }

  /** Persists a message, bumps the thread's activity, and broadcasts it. */
  async sendMessage(
    user: AuthenticatedUser,
    threadId: string,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    const participants = await this.assertParticipant(user.id, threadId);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: { threadId, senderId: user.id, body: dto.body },
      });
      await tx.chatThread.update({
        where: { id: threadId },
        data: { lastMessageAt: created.createdAt },
      });
      return created;
    });

    const view = toMessageView(message, user.id);
    this.realtime.emitNewMessage(view, participants.counterpartUserId);
    return view;
  }

  /** Marks the counterparty's unread messages as read and emits a receipt. */
  async markRead(user: AuthenticatedUser, threadId: string): Promise<{ readCount: number }> {
    await this.assertParticipant(user.id, threadId);
    const readAt = new Date();
    const result = await this.prisma.chatMessage.updateMany({
      where: { threadId, senderId: { not: user.id }, readAt: null },
      data: { readAt },
    });
    if (result.count > 0) {
      this.realtime.emitRead({ threadId, readerUserId: user.id, readAt });
    }
    return { readCount: result.count };
  }

  /** Total unread messages across all the caller's threads (badge count). */
  async unreadCount(user: AuthenticatedUser): Promise<{ count: number }> {
    const scope = await this.threadScope(user);
    if (!scope) {
      return { count: 0 };
    }
    const count = await this.prisma.chatMessage.count({
      where: { senderId: { not: user.id }, readAt: null, thread: scope },
    });
    return { count };
  }

  /**
   * Loads a thread and asserts the caller is one of its two participants,
   * returning both participant user ids and the counterparty. A non-participant
   * is told the thread does not exist (never leak its presence).
   */
  async assertParticipant(userId: string, threadId: string): Promise<ThreadParticipants> {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        student: { select: { userId: true } },
        tutor: { select: { userId: true } },
      },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    const studentUserId = thread.student.userId;
    const tutorUserId = thread.tutor.userId;
    if (userId !== studentUserId && userId !== tutorUserId) {
      throw new NotFoundException('Thread not found');
    }
    return {
      threadId,
      studentUserId,
      tutorUserId,
      counterpartUserId: userId === studentUserId ? tutorUserId : studentUserId,
    };
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private async resolvePair(
    user: AuthenticatedUser,
    dto: StartThreadDto,
  ): Promise<{ studentId: string; tutorId: string }> {
    if (user.role === UserRole.STUDENT) {
      if (!dto.tutorId) {
        throw new BadRequestException('tutorId is required');
      }
      const studentId = await this.ensureStudentProfileId(user.id);
      return { studentId, tutorId: dto.tutorId };
    }
    if (user.role === UserRole.TUTOR) {
      if (!dto.studentId) {
        throw new BadRequestException('studentId is required');
      }
      const tutorId = await this.tutorProfileIdOrThrow(user.id);
      return { studentId: dto.studentId, tutorId };
    }
    throw new ForbiddenException('Only students and tutors can use chat');
  }

  /** Where-clause scoping threads to the caller, or null if they have no profile. */
  private async threadScope(user: AuthenticatedUser): Promise<Prisma.ChatThreadWhereInput | null> {
    if (user.role === UserRole.STUDENT) {
      return { studentId: await this.ensureStudentProfileId(user.id) };
    }
    if (user.role === UserRole.TUTOR) {
      const tutorId = await this.tutorProfileId(user.id);
      return tutorId ? { tutorId } : null;
    }
    return null;
  }

  private countUnread(threadId: string, userId: string): Promise<number> {
    return this.prisma.chatMessage.count({
      where: { threadId, senderId: { not: userId }, readAt: null },
    });
  }

  private async unreadCountsFor(threadIds: string[], userId: string): Promise<Map<string, number>> {
    if (threadIds.length === 0) {
      return new Map();
    }
    const groups = await this.prisma.chatMessage.groupBy({
      by: ['threadId'],
      where: { threadId: { in: threadIds }, senderId: { not: userId }, readAt: null },
      _count: { _all: true },
    });
    return new Map(groups.map((group): [string, number] => [group.threadId, group._count._all]));
  }

  /**
   * Resolves the caller's student profile id, creating an empty profile on first
   * use. Handles the concurrent-first-write race via the unique index on userId.
   */
  private async ensureStudentProfileId(userId: string): Promise<string> {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    try {
      const created = await this.prisma.studentProfile.create({
        data: { userId },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.studentProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (raced) return raced.id;
      }
      throw error;
    }
  }

  private async tutorProfileId(userId: string): Promise<string | null> {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  private async tutorProfileIdOrThrow(userId: string): Promise<string> {
    const id = await this.tutorProfileId(userId);
    if (!id) {
      throw new NotFoundException('Tutor profile not found');
    }
    return id;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api test chat.service`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/chat/chat.service.ts apps/tutora-api/src/modules/chat/chat.service.spec.ts
git commit -m "feat(api): chat service — threads, messages, read, unread (#34)"
```

---

## Task 8: ChatGateway (Socket.io lifecycle, join, typing, presence)

**Files:**

- Create: `apps/tutora-api/src/modules/chat/chat.gateway.ts`
- Test: `apps/tutora-api/src/modules/chat/chat.gateway.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CHAT_EVENTS, threadRoom, userRoom } from './chat.events';
import { ChatGateway } from './chat.gateway';
import { ChatPresenceService } from './chat.presence';
import { ChatRealtime } from './chat.realtime';
import type { ChatService } from './chat.service';

function buildSocket(overrides: Record<string, unknown> = {}) {
  const emit = jest.fn();
  const socket: Record<string, unknown> = {
    id: 'sock1',
    data: {},
    handshake: { auth: { token: 'good' }, headers: {} },
    rooms: new Set<string>(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    to: jest.fn(() => ({ emit })),
    ...overrides,
  };
  return { socket: socket as never, emit };
}

function buildGateway(opts: { verify?: jest.Mock; assertParticipant?: jest.Mock } = {}) {
  const jwt = {
    verifyAsync: opts.verify ?? jest.fn().mockResolvedValue({ sub: 'u1' }),
  } as unknown as JwtService;
  const config = { getOrThrow: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;
  const presence = new ChatPresenceService();
  const realtime = new ChatRealtime();
  const chat = {
    assertParticipant:
      opts.assertParticipant ?? jest.fn().mockResolvedValue({ counterpartUserId: 'u2' }),
  } as unknown as ChatService;
  const gateway = new ChatGateway(realtime, presence, chat, jwt, config);
  return { gateway, presence, chat };
}

describe('ChatGateway.handleConnection', () => {
  it('authenticates, registers presence and joins the personal room', async () => {
    const { gateway, presence } = buildGateway();
    const { socket } = buildSocket();

    await gateway.handleConnection(socket);

    expect((socket as { data: { userId?: string } }).data.userId).toBe('u1');
    expect(presence.isOnline('u1')).toBe(true);
    expect((socket as { join: jest.Mock }).join).toHaveBeenCalledWith(userRoom('u1'));
    expect((socket as { on: jest.Mock }).on).toHaveBeenCalledWith(
      'disconnecting',
      expect.any(Function),
    );
  });

  it('disconnects a socket with an invalid token', async () => {
    const verify = jest.fn().mockRejectedValue(new Error('bad'));
    const { gateway, presence } = buildGateway({ verify });
    const { socket } = buildSocket();

    await gateway.handleConnection(socket);

    expect((socket as { disconnect: jest.Mock }).disconnect).toHaveBeenCalled();
    expect((socket as { join: jest.Mock }).join).not.toHaveBeenCalled();
    expect(presence.isOnline('u1')).toBe(false);
  });
});

describe('ChatGateway thread events', () => {
  it('joins a thread room after the participant check passes', async () => {
    const { gateway, chat } = buildGateway();
    const { socket } = buildSocket({ data: { userId: 'u1' } });

    await gateway.onThreadJoin(socket, { threadId: 't1' });

    expect((chat as { assertParticipant: jest.Mock }).assertParticipant).toHaveBeenCalledWith(
      'u1',
      't1',
    );
    expect((socket as { join: jest.Mock }).join).toHaveBeenCalledWith(threadRoom('t1'));
  });

  it('rejects joining a thread the caller does not participate in', async () => {
    const assertParticipant = jest.fn().mockRejectedValue(new Error('nope'));
    const { gateway } = buildGateway({ assertParticipant });
    const { socket } = buildSocket({ data: { userId: 'u1' } });

    await expect(gateway.onThreadJoin(socket, { threadId: 't1' })).rejects.toThrow();
    expect((socket as { join: jest.Mock }).join).not.toHaveBeenCalled();
  });

  it('broadcasts typing to the rest of the thread room', async () => {
    const { gateway } = buildGateway();
    const { socket, emit } = buildSocket({ data: { userId: 'u1' } });

    await gateway.onTyping(socket, { threadId: 't1', isTyping: true });

    expect((socket as { to: jest.Mock }).to).toHaveBeenCalledWith(threadRoom('t1'));
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.TYPING, {
      threadId: 't1',
      userId: 'u1',
      isTyping: true,
    });
  });
});

describe('ChatGateway disconnecting', () => {
  it('emits offline to the thread rooms on the user’s last socket', async () => {
    const { gateway, presence } = buildGateway();
    const { socket, emit } = buildSocket();
    await gateway.handleConnection(socket);
    (socket as { rooms: Set<string> }).rooms = new Set([threadRoom('t1'), userRoom('u1')]);

    const onMock = (socket as { on: jest.Mock }).on;
    const disconnecting = onMock.mock.calls.find(
      (call) => call[0] === 'disconnecting',
    )?.[1] as () => void;
    disconnecting();

    expect(presence.isOnline('u1')).toBe(false);
    expect((socket as { to: jest.Mock }).to).toHaveBeenCalledWith(threadRoom('t1'));
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.PRESENCE, { userId: 'u1', status: 'offline' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tutora/api test chat.gateway`
Expected: FAIL — cannot find module `./chat.gateway`.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '@modules/auth/types/auth.types';
import {
  CHAT_EVENTS,
  CHAT_NAMESPACE,
  THREAD_ROOM_PREFIX,
  threadRoom,
  userRoom,
} from './chat.events';
import { ChatPresenceService } from './chat.presence';
import { ChatRealtime } from './chat.realtime';
import { ChatService } from './chat.service';

const BEARER_PREFIX = 'Bearer ';

/** Per-socket data we attach after authenticating the handshake. */
interface ChatSocketData {
  userId?: string;
}

/** Typed view over socket.io's untyped `client.data` (avoids no-unsafe lint). */
const socketData = (client: Socket): ChatSocketData => client.data as ChatSocketData;

/**
 * Realtime chat transport (#34). Authenticates the handshake JWT, tracks
 * presence, and relays typing/presence within thread rooms. Message delivery
 * and read receipts are pushed by ChatService via ChatRealtime after the REST
 * write commits. Single-instance: multi-node fan-out needs the socket.io Redis
 * adapter (see the spec).
 */
@WebSocketGateway({ namespace: CHAT_NAMESPACE, cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly realtime: ChatRealtime,
    private readonly presence: ChatPresenceService,
    private readonly chat: ChatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server): void {
    this.realtime.bind(server);
    this.logger.log('Chat gateway initialised');
  }

  async handleConnection(client: Socket): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(this.extractToken(client), {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      client.disconnect();
      return;
    }
    const userId = payload.sub;
    socketData(client).userId = userId;
    this.presence.add(userId, client.id);
    await client.join(userRoom(userId));
    client.on('disconnecting', () => this.handleDisconnecting(client));
  }

  @SubscribeMessage(CHAT_EVENTS.THREAD_JOIN)
  async onThreadJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string },
  ): Promise<void> {
    const userId = socketData(client).userId;
    if (!userId) {
      return;
    }
    await this.chat.assertParticipant(userId, body.threadId);
    await client.join(threadRoom(body.threadId));
    client.to(threadRoom(body.threadId)).emit(CHAT_EVENTS.PRESENCE, { userId, status: 'online' });
  }

  @SubscribeMessage(CHAT_EVENTS.THREAD_LEAVE)
  async onThreadLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string },
  ): Promise<void> {
    await client.leave(threadRoom(body.threadId));
  }

  @SubscribeMessage(CHAT_EVENTS.TYPING)
  async onTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string; isTyping: boolean },
  ): Promise<void> {
    const userId = socketData(client).userId;
    if (!userId) {
      return;
    }
    await this.chat.assertParticipant(userId, body.threadId);
    client.to(threadRoom(body.threadId)).emit(CHAT_EVENTS.TYPING, {
      threadId: body.threadId,
      userId,
      isTyping: body.isTyping,
    });
  }

  /**
   * Fires on `disconnecting`, where the socket still exposes its rooms. On the
   * user's last socket, tells the thread rooms they were in that they went
   * offline.
   */
  private handleDisconnecting(client: Socket): void {
    const userId = socketData(client).userId;
    if (!userId) {
      return;
    }
    const wasLast = this.presence.remove(userId, client.id);
    if (!wasLast) {
      return;
    }
    for (const room of client.rooms) {
      if (room.startsWith(THREAD_ROOM_PREFIX)) {
        client.to(room).emit(CHAT_EVENTS.PRESENCE, { userId, status: 'offline' });
      }
    }
  }

  private extractToken(client: Socket): string {
    const auth = client.handshake.auth as { token?: string };
    if (auth?.token) {
      return auth.token;
    }
    const header = client.handshake.headers.authorization;
    if (header?.startsWith(BEARER_PREFIX)) {
      return header.slice(BEARER_PREFIX.length).trim();
    }
    return '';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tutora/api test chat.gateway`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/chat/chat.gateway.ts apps/tutora-api/src/modules/chat/chat.gateway.spec.ts
git commit -m "feat(api): chat gateway — auth, join, typing, presence (#34)"
```

---

## Task 9: Controller, module & app wiring

**Files:**

- Create: `apps/tutora-api/src/modules/chat/chat.controller.ts`
- Create: `apps/tutora-api/src/modules/chat/chat.module.ts`
- Modify: `apps/tutora-api/src/app.module.ts`

- [ ] **Step 1: Write `chat.controller.ts`**

```typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import type { Paginated } from '@common/pagination/page';
import { ChatService } from './chat.service';
import type { MessageView, ThreadView } from './chat.types';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { StartThreadDto } from './dto/start-thread.dto';

/** Realtime student↔tutor chat (#34). Both roles share these endpoints. */
@ApiTags('chat')
@ApiBearerAuth('bearer')
@Controller({ path: 'chat', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.TUTOR)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('threads')
  @ApiOperation({ summary: 'List the caller’s chat threads (paginated)' })
  listThreads(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListThreadsQueryDto,
  ): Promise<Paginated<ThreadView>> {
    return this.chat.listThreads(user, query);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Open (or fetch) a thread with a counterparty' })
  openThread(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartThreadDto,
  ): Promise<ThreadView> {
    return this.chat.openThread(user, dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Total unread messages across all threads' })
  unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    return this.chat.unreadCount(user);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'List a thread’s messages (paginated, newest first)' })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<Paginated<MessageView>> {
    return this.chat.listMessages(user, id, query);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send a message in a thread' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageView> {
    return this.chat.sendMessage(user, id, dto);
  }

  @Post('threads/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a thread’s incoming messages as read' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ readCount: number }> {
    return this.chat.markRead(user, id);
  }
}
```

- [ ] **Step 2: Write `chat.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatPresenceService } from './chat.presence';
import { ChatRealtime } from './chat.realtime';
import { ChatService } from './chat.service';

/**
 * Realtime chat (#34). Imports AuthModule for JwtService (WS handshake auth) and
 * the route guards. PrismaService and ConfigService are globally provided.
 */
@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatRealtime, ChatPresenceService],
})
export class ChatModule {}
```

- [ ] **Step 3: Register `ChatModule` in `app.module.ts`**

Add the import next to the other feature-module imports:

```typescript
import { ChatModule } from '@modules/chat/chat.module';
```

Add `ChatModule` to the `imports` array, immediately after `ReviewsModule`:

```typescript
    ApplicationsModule,
    ReviewsModule,
    ChatModule,
    HealthModule,
```

- [ ] **Step 4: Typecheck & build**

Run: `pnpm --filter @tutora/api typecheck`
Expected: exits 0.

Run: `pnpm --filter @tutora/api build`
Expected: exits 0 (confirms the gateway wires into the Nest app with the socket.io platform installed).

- [ ] **Step 5: Commit**

```bash
git add apps/tutora-api/src/modules/chat/chat.controller.ts apps/tutora-api/src/modules/chat/chat.module.ts apps/tutora-api/src/app.module.ts
git commit -m "feat(api): chat controller and module wiring (#34)"
```

---

## Task 10: Full verification & spec close-out

**Files:**

- Modify: `docs/superpowers/specs/2026-07-12-chat-module-realtime-design.md` (status)

- [ ] **Step 1: Run the whole backend test suite**

Run: `pnpm --filter @tutora/api test`
Expected: PASS — all suites, including the new chat suites (presence, mapper, realtime, service, gateway).

- [ ] **Step 2: Lint & typecheck**

Run: `pnpm --filter @tutora/api lint`
Expected: exits 0, no new warnings.

Run: `pnpm --filter @tutora/api typecheck`
Expected: exits 0.

- [ ] **Step 3: Mark the spec status Done**

In `docs/superpowers/specs/2026-07-12-chat-module-realtime-design.md`, change the Status line to:

```markdown
- **Status:** Implemented
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-07-12-chat-module-realtime-design.md
git commit -m "docs(chat): mark realtime chat spec implemented (#34)"
```

- [ ] **Step 5: Push & open the PR**

```bash
git push -u origin feature/api-chat-realtime
gh pr create --fill --base main --title "feat(api): realtime chat module (#34)" --body "Closes #34"
```

---

## Notes for the implementer

- **Prisma `orderBy` nulls:** `{ lastMessageAt: { sort: 'desc', nulls: 'last' } }` is valid Prisma 6 syntax; keep threads with no messages at the bottom.
- **`groupBy` shape:** `_count: { _all: true }` yields `group._count._all` (a number) per `threadId`.
- **Emit after commit:** `sendMessage`/`markRead` emit only after the DB write resolves — never inside the `$transaction` callback.
- **No schema migration:** the `ChatThread`/`ChatMessage` models already exist. Do not add a migration.
- **Windows/pnpm:** pnpm is installed globally (`npm i -g pnpm`); run all commands with `pnpm --filter @tutora/api ...` from the repo root.
- **Out of scope (documented):** socket.io Redis adapter for horizontal scale, attachments, push notifications, message edit/delete, cursor pagination.

```

```
