/**
 * auth-storage — secure token persistence (issue #22).
 *
 * Wraps `expo-secure-store` so the rest of the app never touches the native
 * module or bare string keys directly. Tokens are stored in the OS keychain /
 * keystore (encrypted at rest) — never in AsyncStorage or plaintext. #24 will
 * consume `getTokens()` to hydrate the shared Axios client + refresh flow.
 */
import * as SecureStore from 'expo-secure-store';

import { AUTH_STORAGE_KEYS } from '../constants';
import type { AuthTokens } from '../types';

async function setTokens({ accessToken, refreshToken }: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(AUTH_STORAGE_KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(AUTH_STORAGE_KEYS.refreshToken, refreshToken),
  ]);
}

async function getTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(AUTH_STORAGE_KEYS.accessToken),
    SecureStore.getItemAsync(AUTH_STORAGE_KEYS.refreshToken),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

async function clear(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.accessToken),
    SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.refreshToken),
  ]);
}

export const authStorage = { setTokens, getTokens, clear } as const;
