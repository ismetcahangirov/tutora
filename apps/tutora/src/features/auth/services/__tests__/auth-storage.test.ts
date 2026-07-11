/**
 * auth-storage service — Secure Store persistence (issue #22).
 *
 * `expo-secure-store` is a native module, so it is mocked here; we assert that
 * the service reads/writes the right typed keys and clears both tokens.
 */
import * as SecureStore from 'expo-secure-store';

import { AUTH_STORAGE_KEYS } from '@features/auth/constants';

import { authStorage } from '../auth-storage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockedStore = jest.mocked(SecureStore);

const TOKENS = { accessToken: 'access-123', refreshToken: 'refresh-456' };

describe('authStorage (#22)', () => {
  it('persists both tokens under their namespaced keys', async () => {
    await authStorage.setTokens(TOKENS);

    expect(mockedStore.setItemAsync).toHaveBeenCalledWith(
      AUTH_STORAGE_KEYS.accessToken,
      TOKENS.accessToken,
    );
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith(
      AUTH_STORAGE_KEYS.refreshToken,
      TOKENS.refreshToken,
    );
  });

  it('returns the token pair when both are present', async () => {
    mockedStore.getItemAsync.mockImplementation(async (key) =>
      key === AUTH_STORAGE_KEYS.accessToken ? TOKENS.accessToken : TOKENS.refreshToken,
    );

    await expect(authStorage.getTokens()).resolves.toEqual(TOKENS);
  });

  it('returns null when either token is missing', async () => {
    mockedStore.getItemAsync.mockImplementation(async (key) =>
      key === AUTH_STORAGE_KEYS.accessToken ? TOKENS.accessToken : null,
    );

    await expect(authStorage.getTokens()).resolves.toBeNull();
  });

  it('clears both tokens', async () => {
    await authStorage.clear();

    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_STORAGE_KEYS.accessToken);
    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_STORAGE_KEYS.refreshToken);
  });
});
