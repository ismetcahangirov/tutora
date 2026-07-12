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
