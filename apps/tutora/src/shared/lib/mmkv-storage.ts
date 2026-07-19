import { createMMKV, type MMKV } from 'react-native-mmkv';

/**
 * Shared MMKV-backed key-value store for the app's small persisted-state seams
 * (i18n, appearance, favorites, comparison, saved searches).
 *
 * `eas update`'s static export renders every route on the server (Node, no
 * browser) before it ever reaches a client. MMKV's web build throws when
 * touched there (see `react-native-mmkv/lib/web/getLocalStorage.js`'s
 * `canUseDOM` check), and several read paths run synchronously during render
 * (i18n's init, `useSyncExternalStore` snapshots) — so any of them can hit
 * that throw during export. The server pass never needs to persist anything
 * anyway (only the client, browser or native, ever does), so swallow it and
 * act like nothing is stored rather than crashing the export.
 */
export interface AppStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
}

function createSafeStorage(): AppStorage {
  let mmkv: MMKV | undefined;
  try {
    mmkv = createMMKV({ id: 'tutora' });
  } catch {
    mmkv = undefined;
  }

  return {
    getString(key) {
      try {
        return mmkv?.getString(key);
      } catch {
        return undefined;
      }
    },
    set(key, value) {
      try {
        mmkv?.set(key, value);
      } catch {
        // no-op: nothing to persist during a server-only render pass
      }
    },
  };
}

export const storage: AppStorage = createSafeStorage();
