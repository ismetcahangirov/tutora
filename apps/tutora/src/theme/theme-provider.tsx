/**
 * ThemeProvider — issue #16.
 *
 * System-aware theming. When the preference is 'system' the resolved mode follows
 * the OS color scheme; otherwise it is forced. The resolved theme is derived
 * during render (no `useEffect`), so OS changes propagate automatically.
 *
 * Persistence is intentionally not built in: pass `initialPreference` and listen
 * via `onPreferenceChange` to wire a storage layer (e.g. MMKV) without changing
 * this component.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { themes, type ThemeMode, type ThemePreference } from './theme';
import { ThemeContext, type ThemeContextValue } from './theme-context';

export type ThemeProviderProps = {
  children: ReactNode;
  /** Initial preference. Defaults to following the OS. */
  initialPreference?: ThemePreference;
  /** Called whenever the preference changes — use it to persist the choice. */
  onPreferenceChange?: (preference: ThemePreference) => void;
};

function resolveMode(preference: ThemePreference, systemScheme: ThemeMode): ThemeMode {
  return preference === 'system' ? systemScheme : preference;
}

export function ThemeProvider({
  children,
  initialPreference = 'system',
  onPreferenceChange,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const systemScheme: ThemeMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const mode = resolveMode(preference, systemScheme);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      onPreferenceChange?.(next);
    },
    [onPreferenceChange],
  );

  const toggle = useCallback(() => {
    setPreference(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[mode], mode, preference, setPreference, toggle }),
    [mode, preference, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
