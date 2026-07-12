import { type ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits HTTP traffic only. The base guard reads `req.ip` and writes
 * `RateLimit-*` headers via `res.header(...)`; a WebSocket execution context has
 * neither, so letting the global guard run against the chat gateway would crash
 * every message. Scoping to `http` leaves realtime handlers untouched (and future
 * microservice transports too).
 */
@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  protected override shouldSkip(context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(context.getType() !== 'http');
  }
}
