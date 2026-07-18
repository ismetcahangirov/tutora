/**
 * google-auth.gateway — thin boundary over Google sign-in (issue #22).
 *
 * Uses the native `@react-native-google-signin/google-signin` (Google Play
 * Services). Configured with the **web** client id so the returned `idToken`'s
 * `aud` is the server/web client the backend verifies against (`GOOGLE_CLIENT_ID`).
 * The native flow avoids the browser custom-scheme redirect that the New
 * Architecture (bridgeless) build cannot reliably capture.
 *
 * The whole native surface lives behind `signIn()` / `signOut()` so the hook and
 * context stay unit-testable with this module mocked — the native module never
 * loads under Jest.
 */
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

import { env } from '@/shared/config/env';

import type { GoogleAuthGateway, GoogleCredential } from '../types';

// Configure once at module load. `webClientId` makes the id_token's audience the
// web/server client the backend verifies; the Android client is matched by
// package name + SHA-1 in the Google Cloud console, so it needs no id here.
GoogleSignin.configure({
  webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

async function signIn(): Promise<GoogleCredential> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    // The user dismissed the account picker before choosing an account.
    throw new Error('google-signin:cancelled');
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('google-signin:no-id-token');
  }

  return { idToken };
}

async function signOut(): Promise<void> {
  await GoogleSignin.signOut();
}

export const googleAuthGateway: GoogleAuthGateway = { signIn, signOut };
