/**
 * Root layout — wires the design-system providers for the whole app (epic #8).
 *
 * Order matters: GestureHandlerRootView (for @gorhom/bottom-sheet + gestures) →
 * SafeAreaProvider → I18nProvider (so screens translate) → ThemeProvider
 * (system-aware dark mode) → QueryProvider (server-state cache) → ToastProvider.
 * Fonts load before the UI shows so text never flashes in a fallback family.
 *
 * `NotificationsBridge` (#50) sits inside the auth + query context so it can
 * register the device for push and react to notifications once a user is signed
 * in; it renders nothing. `UpdatesBridge` sits alongside it and renders the
 * OTA update prompt (dialog → progress bar → branded restart) when one is
 * available; otherwise it also renders nothing.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@features/auth';
import { NotificationsBridge } from '@features/notifications';
import { UpdatesBridge } from '@features/updates';
import { I18nProvider } from '@/shared/i18n';
import { initSentry, wrapWithSentry } from '@/shared/observability/sentry';
import { QueryProvider } from '@/shared/query';
import { ThemeProvider, useAppFonts } from '@/theme';
import { getStoredAppearance, setStoredAppearance } from '@/theme/appearance-storage';

// Start crash reporting before anything renders so early errors are captured.
initSentry();
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { fontsLoaded, fontError } = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider
            initialPreference={getStoredAppearance() ?? 'system'}
            onPreferenceChange={setStoredAppearance}
          >
            <QueryProvider>
              <AuthProvider>
                <ToastProvider>
                  <StatusBar style="auto" />
                  <NotificationsBridge />
                  <UpdatesBridge />
                  <Stack screenOptions={{ headerShown: false }} />
                </ToastProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

// Wrap the root so Sentry captures render errors and navigation breadcrumbs.
export default wrapWithSentry(RootLayout);
