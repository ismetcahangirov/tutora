import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import type { PushPayload, PushResult } from './notifications.types';

/** Named Firebase app so init is idempotent and never clashes with a default app. */
const FIREBASE_APP_NAME = 'tutora';

/** FCM error codes that mean a token is dead and should be pruned. */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/** Max tokens per FCM multicast request (Firebase hard limit). */
const MULTICAST_CHUNK = 500;

const EMPTY_RESULT: PushResult = { successCount: 0, failureCount: 0, invalidTokens: [] };

/**
 * Sends push notifications through Firebase Cloud Messaging (#35).
 *
 * Credentials come from `FIREBASE_*` env. When they are not configured (local
 * dev, tests, CI) the transport becomes a no-op — features that raise
 * notifications never fail for want of credentials, exactly like `MailService`.
 * The service never throws: transport failures are reported via {@link PushResult}
 * so the caller can prune dead tokens without a notification write ever rolling back.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly messaging: Messaging | null;

  constructor(config: ConfigService) {
    const projectId = config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      const app = this.resolveApp({ projectId, clientEmail, privateKey });
      this.messaging = getMessaging(app);
    } else {
      this.messaging = null;
      this.logger.warn('Firebase not configured — push notifications will be skipped.');
    }
  }

  /** Whether a live FCM transport is available (false in dev/test/CI without creds). */
  get isConfigured(): boolean {
    return this.messaging !== null;
  }

  /**
   * Delivers a push to the given device tokens. De-duplicates tokens, chunks to
   * FCM's per-request limit, and collects tokens FCM rejected as dead so the
   * caller can delete them. A no-op (and success-count 0) when unconfigured.
   */
  async sendToTokens(tokens: string[], payload: PushPayload): Promise<PushResult> {
    const unique = [...new Set(tokens)];
    if (!this.messaging || unique.length === 0) {
      return EMPTY_RESULT;
    }

    const messaging = this.messaging;
    const result: PushResult = { successCount: 0, failureCount: 0, invalidTokens: [] };

    for (let i = 0; i < unique.length; i += MULTICAST_CHUNK) {
      const chunk = unique.slice(i, i + MULTICAST_CHUNK);
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title: payload.title, body: payload.body },
          data: payload.data,
        });
        result.successCount += response.successCount;
        result.failureCount += response.failureCount;
        response.responses.forEach((res, index) => {
          const token = chunk[index];
          if (token && !res.success && res.error && DEAD_TOKEN_CODES.has(res.error.code)) {
            result.invalidTokens.push(token);
          }
        });
      } catch (error) {
        // Whole-batch failure (e.g. network / auth) — degrade gracefully.
        result.failureCount += chunk.length;
        this.logger.error(
          `Push delivery failed for ${chunk.length} token(s): ${(error as Error).message}`,
        );
      }
    }

    return result;
  }

  /** Returns the existing named app or initializes it once. */
  private resolveApp(creds: { projectId: string; clientEmail: string; privateKey: string }): App {
    const existing = getApps().find((app) => app.name === FIREBASE_APP_NAME);
    if (existing) {
      return existing;
    }
    return (
      initializeApp({ credential: cert(creds) }, FIREBASE_APP_NAME) ?? getApp(FIREBASE_APP_NAME)
    );
  }
}
