import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export type AppUpdateStatus = 'idle' | 'available' | 'downloading' | 'restarting';

export type UseAppUpdatesResult = {
  status: AppUpdateStatus;
  downloadProgress: number | undefined;
  apply: () => Promise<void>;
  dismiss: () => void;
};

/**
 * Drives the visible update prompt (dialog → progress bar → restart).
 * `expo-updates` already checks once on cold start; this re-checks whenever
 * the app returns to the foreground, same trigger as the previous silent
 * hook, but now surfaces state for a UI instead of reloading unattended.
 *
 * `Updates.useUpdates()` is always called (rules-of-hooks — `Updates.isEnabled`
 * is a build-time constant, not something that can change between renders of
 * a running instance, so it must never gate the hook call itself, only what
 * we *do* with its result and whether we issue imperative calls). In dev /
 * Expo Go / web, `isEnabled` is false, so status is forced to `'idle'`
 * regardless of what the (inert there) native module reports.
 */
export function useAppUpdates(): UseAppUpdatesResult {
  const [dismissed, setDismissed] = useState(false);
  const { isUpdateAvailable, isDownloading, isUpdatePending, downloadProgress } =
    Updates.useUpdates();

  useEffect(() => {
    if (!Updates.isEnabled) return;

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        setDismissed(false);
        void Updates.checkForUpdateAsync().catch(() => {
          // A failed check never blocks the running bundle.
        });
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Updates.isEnabled && isUpdatePending) {
      void Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  async function apply(): Promise<void> {
    try {
      await Updates.fetchUpdateAsync();
    } catch {
      // Download failure: stay on the current bundle, no crash.
    }
  }

  function dismiss(): void {
    setDismissed(true);
  }

  let status: AppUpdateStatus = 'idle';
  if (Updates.isEnabled) {
    if (isUpdatePending) {
      status = 'restarting';
    } else if (isDownloading) {
      status = 'downloading';
    } else if (isUpdateAvailable && !dismissed) {
      status = 'available';
    }
  }

  return {
    status,
    downloadProgress: Updates.isEnabled ? downloadProgress : undefined,
    apply,
    dismiss,
  };
}
