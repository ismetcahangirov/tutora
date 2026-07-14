import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { I18nProvider } from '@shared/i18n';
import { queryClient } from '@shared/query/query-client';
import { ThemeProvider } from '@shared/theme';

/** Composes the app-wide providers: server state, i18n, and theming. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
