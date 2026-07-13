/**
 * Push registration — the native (expo-notifications) side of #50.
 *
 * Isolates every `expo-notifications` / device call behind small, mockable
 * functions so the hooks and observer stay pure and testable. The token we
 * register is the **native device push token** (`getDevicePushTokenAsync`) — an
 * FCM token on Android, an APNs token on iOS — because the backend transport (#35)
 * is Firebase Admin, which sends to native tokens (not Expo push tokens).
 *
 * Everything here fails soft: a simulator, an unsupported platform, denied
 * permission, or a native error yields `null` rather than throwing, so a device
 * that can't receive pushes never breaks sign-in.
 */
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { DEVICE_TOKEN_MAX_LENGTH } from '../constants';
import type { DevicePlatform, RegisterDeviceInput } from '../types';

/** Android delivers notifications through channels; this is our single default one. */
const ANDROID_CHANNEL_ID = 'default';

/** Map the RN platform to the backend `DevicePlatform`; `null` for anything else. */
export function resolveDevicePlatform(os: typeof Platform.OS): DevicePlatform | null {
  switch (os) {
    case 'ios':
      return 'IOS';
    case 'android':
      return 'ANDROID';
    case 'web':
      return 'WEB';
    default:
      return null;
  }
}

/**
 * Configure how a notification is presented while the app is foregrounded —
 * without this, foreground pushes are silent. Idempotent; safe to call on mount.
 */
export function configureForegroundPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Android requires an explicit channel for notifications to be delivered. */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Request notification permission if not already granted; returns whether granted. */
async function ensurePermissionGranted(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }
  if (!existing.canAskAgain) {
    return false;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Acquire a native device push token, requesting permission and setting up the
 * Android channel first. Returns `null` (never throws) when the device can't
 * receive pushes, so the caller degrades to "no push" silently.
 */
export async function acquirePushRegistration(): Promise<RegisterDeviceInput | null> {
  try {
    if (!Device.isDevice) {
      // Simulators/emulators have no push token — skip without noise.
      return null;
    }
    const platform = resolveDevicePlatform(Platform.OS);
    if (!platform) {
      return null;
    }
    if (!(await ensurePermissionGranted())) {
      return null;
    }
    await ensureAndroidChannel();

    const { data } = await Notifications.getDevicePushTokenAsync();
    const token = typeof data === 'string' ? data : JSON.stringify(data);
    if (!token || token.length > DEVICE_TOKEN_MAX_LENGTH) {
      return null;
    }
    return { token, platform };
  } catch (error) {
    // Never let a push-setup failure break the authenticated session.
    console.warn('[notifications] Failed to acquire push token', error);
    return null;
  }
}
