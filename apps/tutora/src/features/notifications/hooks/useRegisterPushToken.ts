/**
 * useRegisterPushToken — register this device for push once authenticated (#50).
 *
 * Acquiring a native token and telling the backend about it is a genuine
 * external-system sync (the one place a mount effect is the right tool, per the
 * hook rules) — not derivable state. It runs once per authenticated session:
 * configure foreground presentation, obtain the device token, and register it.
 * Everything fails soft, so a device that can't receive push never blocks sign-in.
 * Disabling (sign-out) arms it to retry on the next sign-in.
 */
import { useEffect, useRef } from 'react';

import { registerDevice } from '../api/notifications.api';
import {
  acquirePushRegistration,
  configureForegroundPresentation,
} from '../services/push-registration';

export function useRegisterPushToken(enabled: boolean): void {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      // Re-arm so the next authenticated session registers again.
      registeredRef.current = false;
      return;
    }
    if (registeredRef.current) {
      return;
    }
    registeredRef.current = true;

    let cancelled = false;
    const register = async () => {
      configureForegroundPresentation();
      const registration = await acquirePushRegistration();
      if (cancelled || !registration) {
        return;
      }
      try {
        await registerDevice(registration);
      } catch (error) {
        // Registering the token failed — allow a retry on the next session.
        console.warn('[notifications] Failed to register device token', error);
        registeredRef.current = false;
      }
    };
    void register();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
