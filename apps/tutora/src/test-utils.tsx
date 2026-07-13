/**
 * Test helpers — render components inside the app's providers (i18n + theme + safe
 * area).
 *
 * Not a test file itself. `renderWithProviders` / `renderHookWithProviders` wrap
 * the subject in an `I18nProvider`, a `ThemeProvider` (defaulting to light), a
 * `SafeAreaProvider` with fixed metrics so `useSafeAreaInsets` resolves
 * synchronously in tests, and a fresh React Query client (isolated per render, so
 * one test's cache never bleeds into the next). Pass `language` to render in a
 * specific locale.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { I18nProvider, i18n, type SupportedLanguage } from '@/shared/i18n';
import { createQueryClient } from '@/shared/query';
import { ThemeProvider, type ThemePreference } from '@/theme';

const INITIAL_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type ProviderOptions = { preference?: ThemePreference; language?: SupportedLanguage };

function AppProviders({
  children,
  preference = 'light',
}: { children: ReactNode } & Pick<ProviderOptions, 'preference'>) {
  // A fresh client per wrapper instance keeps each test's cache isolated.
  const queryClient = createQueryClient();
  return (
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialPreference={preference}>{children}</ThemeProvider>
        </QueryClientProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { preference, language, ...options }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  if (language) {
    void i18n.changeLanguage(language);
  }
  return render(ui, {
    wrapper: ({ children }) => <AppProviders preference={preference}>{children}</AppProviders>,
    ...options,
  });
}

export function renderHookWithProviders<Result>(
  hook: () => Result,
  { preference, language }: ProviderOptions = {},
) {
  if (language) {
    void i18n.changeLanguage(language);
  }
  return renderHook(hook, {
    wrapper: ({ children }) => <AppProviders preference={preference}>{children}</AppProviders>,
  });
}

export * from '@testing-library/react-native';
