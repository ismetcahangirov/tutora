/**
 * Test helpers — render components inside the app's providers (theme + safe area).
 *
 * Not a test file itself. `renderWithProviders` / `renderHookWithProviders` wrap
 * the subject in a `ThemeProvider` (defaulting to light) and a `SafeAreaProvider`
 * with fixed metrics so `useSafeAreaInsets` resolves synchronously in tests.
 */
import { render, renderHook, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ThemeProvider, type ThemePreference } from '@/theme';

const INITIAL_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type ProviderOptions = { preference?: ThemePreference };

function AppProviders({
  children,
  preference = 'light',
}: { children: ReactNode } & ProviderOptions) {
  return (
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <ThemeProvider initialPreference={preference}>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { preference, ...options }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  return render(ui, {
    wrapper: ({ children }) => <AppProviders preference={preference}>{children}</AppProviders>,
    ...options,
  });
}

export function renderHookWithProviders<Result>(
  hook: () => Result,
  { preference }: ProviderOptions = {},
) {
  return renderHook(hook, {
    wrapper: ({ children }) => <AppProviders preference={preference}>{children}</AppProviders>,
  });
}

export * from '@testing-library/react-native';
