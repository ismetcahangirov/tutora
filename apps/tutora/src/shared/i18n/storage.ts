import { createMMKV, type MMKV } from 'react-native-mmkv';

/**
 * Persistent key-value store for the app (MMKV — issue #82). Mirrors the storage
 * seam the theme provider anticipated; kept behind this thin wrapper so callers
 * depend on a small API, not MMKV directly, and it can be mocked/swapped freely.
 */
const storage: MMKV = createMMKV({ id: 'tutora' });

const LANGUAGE_KEY = 'settings.language';

export function getStoredLanguage(): string | undefined {
  return storage.getString(LANGUAGE_KEY);
}

export function setStoredLanguage(language: string): void {
  storage.set(LANGUAGE_KEY, language);
}
