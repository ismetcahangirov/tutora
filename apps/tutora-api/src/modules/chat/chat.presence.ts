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
