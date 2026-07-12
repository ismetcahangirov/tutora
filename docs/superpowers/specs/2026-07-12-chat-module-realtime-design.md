# Chat Module (Realtime) — Design Spec

- **Issue:** #34 — Chat module (realtime), part of backend epic #25
- **Surface:** `tutora-api` (NestJS backend)
- **Date:** 2026-07-12
- **Status:** Implemented

## 1. Goal

Realtime 1:1 messaging between a **Student** and a **Tutor**. A student and a
tutor who already have an application between them can open a chat thread,
exchange messages, see read receipts and unread counts, and get live
typing/presence signals.

## 2. Scope

**In scope (MVP):**

- Thread lifecycle: open/ensure a thread, list threads.
- Messaging: send message, paginated history.
- Read receipts: mark a thread's incoming messages read; live receipt.
- Unread counts: per-thread and a global badge total.
- Realtime via Socket.io: live message delivery, read receipts, typing
  indicators, and online/offline presence.

**Out of scope (documented follow-ups):**

- **Horizontal scaling** of the WebSocket layer. The socket.io **Redis adapter**
  is required for multi-instance fan-out; Redis is not wired into the backend
  yet, so the gateway runs **single-instance** for now. Presence and typing are
  in-memory and therefore also single-instance.
- Attachments / media messages (text only for MVP).
- Push notifications for offline recipients (separate concern).
- Message editing/deletion, reactions.
- Cursor-based message pagination (MVP uses offset pagination for codebase
  consistency; noted as a possible refinement — see §7).

## 3. Key decisions

1. **Transport = Socket.io WebSocket gateway** (`@nestjs/websockets` +
   `@nestjs/platform-socket.io`). Idiomatic NestJS realtime; supports
   bidirectional events (typing) naturally.
2. **Write path = REST; realtime = broadcast.** All persistence/mutations go
   through REST controllers → service → Prisma (validated, authorized,
   Swagger-documented, unit-tested — consistent with `reviews`/`applications`).
   The gateway is a fan-out layer that broadcasts the result of REST writes and
   handles ephemeral signals (typing, presence). This keeps chat reliable if a
   socket drops.
3. **Thread rule:** a thread may be opened only when an **`Application` row
   exists** between that `(studentId, tutorId)` pair (any status — `PENDING`
   included). Anti-spam gate tied to the marketplace flow.
4. **No schema migration.** The existing `ChatThread` / `ChatMessage` models are
   sufficient. Typing and presence are ephemeral and never persisted.

## 4. Data model (existing — reused as-is)

```prisma
model ChatThread {
  id            String         @id @default(cuid())
  studentId     String         // StudentProfile.id
  tutorId       String         // TutorProfile.id
  lastMessageAt DateTime?
  messages      ChatMessage[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  @@unique([studentId, tutorId])
  @@index([tutorId])
}

model ChatMessage {
  id        String     @id @default(cuid())
  threadId  String
  senderId  String     // User.id
  body      String
  readAt    DateTime?
  createdAt DateTime   @default(now())
  @@index([threadId, createdAt])
  @@index([senderId])
}
```

Notes:

- `ChatThread.studentId`/`tutorId` reference **profile** ids
  (`StudentProfile.id` / `TutorProfile.id`), matching `Application`.
- `ChatMessage.senderId` references **`User.id`** (a message is sent by a user,
  not a profile). Read receipts and unread counts are computed relative to
  `senderId != callerUserId`.
- Unique `(studentId, tutorId)` makes thread creation idempotent.
- `readAt` on a message marks when the recipient read it. In a 1:1 thread only
  the counterparty reads a given message, so a single timestamp is sufficient.

## 5. REST API — `/api/v1/chat`

Guarded at class level: `@UseGuards(JwtAuthGuard, RolesGuard)`,
`@Roles(UserRole.STUDENT, UserRole.TUTOR)`. Current user via `@CurrentUser()`.
Pagination via the shared `PaginationQueryDto` + `buildPage`.

| Method | Path                         | Body / Query                         | Description                                                                                                                         |
| ------ | ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/chat/threads`              | `ListThreadsQueryDto` (page, limit)  | Caller's threads, sorted by `lastMessageAt` desc, each with counterparty summary, last-message preview, and unread count.           |
| `POST` | `/chat/threads`              | `StartThreadDto`                     | Ensure/open a thread with the counterparty. Requires an application to exist. Idempotent (unique constraint). Returns `ThreadView`. |
| `GET`  | `/chat/threads/:id/messages` | `ListMessagesQueryDto` (page, limit) | Paginated message history, newest-first. Participant-only.                                                                          |
| `POST` | `/chat/threads/:id/messages` | `SendMessageDto` (body)              | Persist message, bump `lastMessageAt`, broadcast `message:new`, return `MessageView`.                                               |
| `POST` | `/chat/threads/:id/read`     | —                                    | Mark counterparty's unread messages in this thread as read; broadcast `message:read`. Returns `{ readCount }`.                      |
| `GET`  | `/chat/unread-count`         | —                                    | Total unread across all caller's threads (badge).                                                                                   |

### DTOs

- `StartThreadDto` — role-aware: STUDENT sends `{ tutorId }`, TUTOR sends
  `{ studentId }`. Both optional strings; the service enforces "provide the
  counterparty id matching your role" and derives the caller's own profile id.
- `SendMessageDto` — `{ body: string }`, non-empty, `@MaxLength(MESSAGE_MAX_LENGTH)`
  (e.g. 4000), validation messages via `i18nValidationMessage(...)`.
- `ListThreadsQueryDto` / `ListMessagesQueryDto` — extend `PaginationQueryDto`.

### Authorization rules (service layer, fail closed)

- **Open thread:** resolve caller's profile id from role; require an
  `Application` where `(studentId, tutorId)` matches; upsert the thread.
- **Access thread / messages / read:** caller must be a participant — their
  `studentProfile.id === thread.studentId` **or**
  `tutorProfile.id === thread.tutorId`. A non-participant gets
  `NotFoundException` (do not reveal the thread's existence), mirroring the
  ownership convention in `reviews`/`applications`.
- Business errors use plain NestJS exceptions with English messages (matching
  `reviews`/`applications`); i18n is used for DTO validation only.

### Views (mapper output)

- `ThreadView` — `{ id, counterpart: { userId, name, avatarUrl, role }, lastMessage: { body, createdAt, senderId } | null, unreadCount, lastMessageAt, createdAt }`.
- `MessageView` — `{ id, threadId, senderId, body, readAt, createdAt, isMine }`
  (`isMine` computed relative to the caller).

## 6. WebSocket gateway — namespace `/chat`

`@WebSocketGateway({ namespace: '/chat', cors: { origin: <configured> } })`,
implementing `OnGatewayInit`, `OnGatewayConnection`, `OnGatewayDisconnect`.

### Connection auth

- Read the access token from `socket.handshake.auth.token` (fallback
  `Authorization` header).
- Verify with `JwtService.verifyAsync` using `JWT_ACCESS_SECRET`, mirroring
  `JwtAuthGuard`. Invalid/expired → disconnect the socket.
- On success: attach `userId`/`role` to the socket, register presence, join the
  personal room `user:{userId}`.

### Rooms

- `user:{userId}` — personal room for cross-thread notifications.
- `thread:{threadId}` — joined on demand when a participant opens a thread.

### Events

**Client → server:**

- `thread:join` `{ threadId }` — participant-checked (via `ChatService`) → join
  `thread:{threadId}`; reply with counterparty presence snapshot.
- `thread:leave` `{ threadId }` — leave room.
- `typing` `{ threadId, isTyping }` — participant-checked → broadcast to the room
  (excluding sender). Ephemeral, never persisted.

**Server → client:**

- `message:new` — `MessageView`, emitted to `thread:{threadId}` and the
  counterparty's `user:{counterpartUserId}` room.
- `message:read` — `{ threadId, readerUserId, readAt }`, emitted to the room.
- `typing` — `{ threadId, userId, isTyping }`.
- `presence` — `{ userId, status: 'online' | 'offline' }`, emitted to the thread
  rooms the user shares.

### Presence

- `ChatPresenceService`: in-memory `Map<userId, Set<socketId>>`.
  `add(userId, socketId)`, `remove(userId, socketId) → wasLastSocket`,
  `isOnline(userId)`.
- On connect: mark online. On `disconnecting`, for the user's last socket, emit
  `presence: offline` to the `thread:*` rooms the socket was in (socket.io still
  exposes `socket.rooms` in `disconnecting`).
- Thread-scoped presence bounds complexity and needs no DB/Redis.

## 7. Component boundaries & DI

Breaks the potential `Controller → Service → Gateway → Service` cycle cleanly:

- **`ChatService`** — REST business logic; depends on `PrismaService` and
  `ChatRealtime`. Emits realtime events via `ChatRealtime` after a successful
  write.
- **`ChatRealtime`** — thin provider holding the socket.io `Server` reference
  and typed emit helpers (`emitNewMessage`, `emitRead`). Bound to the live
  `Server` by the gateway in `afterInit`.
- **`ChatGateway`** — WS lifecycle + join/typing/presence; depends on
  `ChatService` (participant checks) and `ChatPresenceService`; binds the
  `Server` into `ChatRealtime`.
- **`ChatPresenceService`** — in-memory presence tracker.
- **`ChatMapper`** — Prisma rows → `ThreadView` / `MessageView`.

No `forwardRef` needed. Each unit is independently unit-testable.

### File layout

```
src/modules/chat/
├── dto/
│   ├── start-thread.dto.ts
│   ├── send-message.dto.ts
│   ├── list-threads-query.dto.ts
│   └── list-messages-query.dto.ts
├── chat.controller.ts
├── chat.service.ts
├── chat.gateway.ts
├── chat.realtime.ts
├── chat.presence.ts
├── chat.mapper.ts
├── chat.events.ts          // event-name constants + payload types
├── chat.types.ts           // ThreadView, MessageView, includes/consts
├── chat.module.ts
├── chat.service.spec.ts
├── chat.gateway.spec.ts
└── chat.presence.spec.ts
```

## 8. App wiring

- Register `ChatModule` in `app.module.ts` (imports `AuthModule` for
  `JwtService`, and `PrismaModule`).
- The default Nest platform is Express; installing `@nestjs/platform-socket.io`
  enables the socket.io adapter automatically. Gateway CORS configured from env
  (mobile origin).

## 9. Dependencies to add (`apps/tutora-api`)

- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`

(NestJS 11-compatible versions.)

## 10. Testing (TDD)

Follow the existing `buildPrismaMock()` + `Test.createTestingModule` pattern.

- **`chat.service.spec.ts`**
  - open thread requires an existing application (reject otherwise);
  - open thread is idempotent (maps `P2002` / returns existing);
  - participant authorization on messages/read (reject non-participant);
  - send message persists + bumps `lastMessageAt` + calls `ChatRealtime.emitNewMessage`;
  - mark read updates only counterparty's unread messages + emits `message:read`;
  - unread counts computed correctly (`senderId != caller`, `readAt null`);
  - pagination shape via `buildPage`.
- **`chat.gateway.spec.ts`**
  - rejects connections with missing/invalid token;
  - `thread:join` denied for non-participant, allowed for participant;
  - `typing` broadcasts to room excluding sender;
  - presence emitted on connect/disconnect.
- **`chat.presence.spec.ts`**
  - add/remove socket tracking; `wasLastSocket`; `isOnline`.

## 11. Definition of Done (per CLAUDE.md)

- Strongly typed; `typecheck` clean; `lint`/`format` clean.
- Unit tests added and passing (service, gateway, presence).
- RBAC enforced (participants only), input validated, fail-closed authz.
- No secrets; no PII/token logging.
- Swagger documents all REST endpoints.
- Conventional Commit + PR template; issue linked (`Closes #34`).

```

```
