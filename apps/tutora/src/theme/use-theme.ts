/**
 * Theme hooks — issue #16.
 *
 * `useTheme` returns the resolved theme; `useColors` is a shorthand for its
 * palette; `useThemeMode` exposes the mode plus preference controls. All three
 * throw when used outside a `ThemeProvider` so misuse fails fast.
 */
import { useContext } from 'react';

import type { ColorTokens } from './tokens';
import type { Theme } from './theme';
import { ThemeContext, type ThemeContextValue } from './theme-context';

function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return context;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useColors(): ColorTokens {
  return useThemeContext().theme.colors;
}

export function useThemeMode(): Pick<
  ThemeContextValue,
  'mode' | 'preference' | 'setPreference' | 'toggle'
> {
  const { mode, preference, setPreference, toggle } = useThemeContext();
  return { mode, preference, setPreference, toggle };
}
