/**
 * Global Jest setup for the Tutora mobile app.
 *
 * `@gorhom/bottom-sheet` transitively pulls in Reanimated → react-native-worklets,
 * which cannot initialize under the Jest (node) environment. Since it is the only
 * Reanimated consumer in the UI kit (every other component animates with RN's
 * `Animated`), we stub the sheet to plain views so component imports load cleanly.
 * Gesture Handler ships its own Jest setup that stubs its native module.
 */
import 'react-native-gesture-handler/jestSetup';
// Initialize the i18n singleton once per test file so `useTranslation` works even
// in hooks rendered without the provider. `jest.mock` calls below are hoisted
// above this import, so MMKV + expo-localization are already stubbed when it runs.
import '@/shared/i18n/config';

// react-native-mmkv is a JSI/Nitro native module with no Jest binding — stub the
// factory with an in-memory store so the i18n persistence layer (issue #82) works
// under Jest.
jest.mock('react-native-mmkv', () => {
  const store = new Map<string, string>();
  return {
    createMMKV: () => ({
      getString: (key: string): string | undefined => store.get(key),
      set: (key: string, value: string): void => {
        store.set(key, value);
      },
      delete: (key: string): void => {
        store.delete(key);
      },
      clearAll: (): void => {
        store.clear();
      },
    }),
  };
});

// Deterministic device locale so i18n boots in English for tests (issue #82).
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }],
}));

// expo-notifications is a native module with no Jest binding — stub the surface
// the notifications feature (#50) uses (push registration + OS listeners) so that
// importing the feature barrel, and anything that re-exports its bridge, loads
// cleanly. Individual tests override return values as needed.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    status: 'granted',
  })),
  requestPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    status: 'granted',
  })),
  getDevicePushTokenAsync: jest.fn(async () => ({ type: 'android', data: 'device-token' })),
  setNotificationChannelAsync: jest.fn(async () => null),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { DEFAULT: 5, HIGH: 6 },
}));

// expo-device reports whether we're on a physical device (push needs one).
jest.mock('expo-device', () => ({ isDevice: true }));

// @sentry/react-native is a native module with no Jest binding — stub the
// surface the observability layer (#92) uses so importing the root layout (and
// anything that wraps a component in Sentry) loads cleanly. `wrap` is identity.
jest.mock('@sentry/react-native', () => ({
  __esModule: true,
  init: jest.fn(),
  wrap: <T>(component: T): T => component,
  captureException: jest.fn(),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const { View } = jest.requireActual('react-native') as typeof import('react-native');

  const BottomSheet = React.forwardRef<unknown, { children?: React.ReactNode }>(
    function BottomSheet({ children }, _ref) {
      return React.createElement(View, null, children);
    },
  );

  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView: Passthrough,
    BottomSheetScrollView: Passthrough,
    BottomSheetBackdrop: () => null,
  };
});
