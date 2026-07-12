import { Logger, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  BaseWsExceptionFilter,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
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
@UseFilters(new BaseWsExceptionFilter())
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
    await this.assertParticipantOrWs(userId, body.threadId);
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
    await this.assertParticipantOrWs(userId, body.threadId);
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

  /**
   * Participant check for WS handlers. Translates the service's HTTP-shaped
   * denial into a WsException so the gateway-scoped BaseWsExceptionFilter can
   * emit a clean `exception` event to the client, instead of the denial
   * escaping into the HTTP global filter.
   */
  private async assertParticipantOrWs(userId: string, threadId: string): Promise<void> {
    try {
      await this.chat.assertParticipant(userId, threadId);
    } catch {
      throw new WsException('You are not a participant of this thread');
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
