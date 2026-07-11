/**
 * google-auth.gateway — thin boundary over the Google sign-in library (issue #22).
 *
 * We use `expo-auth-session` (pure-JS, Expo-friendly) rather than the native
 * `@react-native-google-signin/google-signin`: the latter needs a config-plugin
 * prebuild + a device build to run, which cannot be verified in a CI worktree.
 * The `id_token` implicit flow returns the token the backend verifies.
 *
 * The whole native surface lives behind `signIn()` / `signOut()` so the hook and
 * context are unit-testable with this module mocked — the native module never
 * loads under Jest.
 */
import {
  AuthRequest,
  ResponseType,
  makeRedirectUri,
  type DiscoveryDocument,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { env } from '@/shared/config/env';

import type { GoogleAuthGateway, GoogleCredential } from '../types';

// Ensures the auth popup is dismissed correctly on web / after redirect.
WebBrowser.maybeCompleteAuthSession();

/** Google's OpenID Connect endpoints (static, no network discovery needed). */
const GOOGLE_DISCOVERY: DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/** Picks the OAuth client id registered for the current platform. */
function resolveClientId(): string {
  const clientId =
    Platform.select({
      ios: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      android: env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      default: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    }) || env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      'Google client id is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and the iOS/Android ids for standalone builds).',
    );
  }

  return clientId;
}

async function signIn(): Promise<GoogleCredential> {
  const request = new AuthRequest({
    clientId: resolveClientId(),
    responseType: ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: makeRedirectUri(),
    // Implicit `id_token` flow: no PKCE (that is for the code flow). AuthRequest
    // still auto-generates the `nonce` Google requires for id_token responses.
    usePKCE: false,
    extraParams: { audience: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID },
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);

  if (result.type !== 'success') {
    throw new Error(`google-signin:${result.type}`);
  }

  const idToken = result.params.id_token;
  if (!idToken) {
    throw new Error('google-signin:no-id-token');
  }

  return { idToken };
}

async function signOut(): Promise<void> {
  // The id_token implicit flow keeps no local session to revoke; the app-side
  // session is cleared by removing tokens from Secure Store. Kept for parity
  // with the gateway contract and future native-lib swap.
}

export const googleAuthGateway: GoogleAuthGateway = { signIn, signOut };
