import type { ConfigService } from '@nestjs/config';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';

/**
 * One named Firebase app shared by every consumer (push #35, storage #37) so the
 * service account is initialized exactly once, no matter how many services need it.
 */
const FIREBASE_APP_NAME = 'tutora';

/** Service-account credentials for the Firebase Admin SDK. */
export interface FirebaseCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Reads the service-account credentials from env, returning `null` when any part
 * is missing so callers can degrade gracefully — the no-op transports that keep
 * the API bootable in local dev, tests, and CI without Firebase secrets. The
 * private key may arrive with escaped newlines (`\n`), which are unescaped here.
 */
export function readFirebaseCredentials(config: ConfigService): FirebaseCredentials | null {
  const projectId = config.get<string>('FIREBASE_PROJECT_ID');
  const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');
  const privateKey = config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }
  return { projectId, clientEmail, privateKey };
}

/** Returns the shared named app, initializing it once from the given credentials. */
export function resolveFirebaseApp(creds: FirebaseCredentials): App {
  const existing = getApps().find((app) => app.name === FIREBASE_APP_NAME);
  if (existing) {
    return existing;
  }
  return initializeApp({ credential: cert(creds) }, FIREBASE_APP_NAME) ?? getApp(FIREBASE_APP_NAME);
}
