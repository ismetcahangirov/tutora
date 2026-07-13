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
 * in; it renders nothing.
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
import { I18nProvider } from '@/shared/i18n';
import { QueryProvider } from '@/shared/query';
import { ThemeProvider, useAppFonts } from '@/theme';
import { getStoredAppearance, setStoredAppearance } from '@/theme/appearance-storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
