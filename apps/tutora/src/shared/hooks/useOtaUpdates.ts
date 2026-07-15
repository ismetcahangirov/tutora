import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Applies EAS over-the-air updates in the background (issue #90).
 *
 * `expo-updates` already checks once on cold start; this re-checks whenever the
 * app returns to the foreground so a long-lived session still picks up a newly
 * published update on the app's channel. It is a no-op in dev and Expo Go
 * (`Updates.isEnabled` is false there), so it only ever runs in release builds
 * wired to an update channel via `eas.json`.
 *
 * This is a genuine external-subscription effect (an `AppState` listener with
 * cleanup) — the one sanctioned use of `useEffect` under the hook rules.
 */
export function useOtaUpdates(): void {
  useEffect(() => {
    if (!Updates.isEnabled) return;

    async function applyPendingUpdate(): Promise<void> {
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (!isAvailable) return;
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch {
        // Never let an update check crash the app; the running bundle stays live.
      }
    }

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void applyPendingUpdate();
    });

    return () => subscription.remove();
  }, []);
}
