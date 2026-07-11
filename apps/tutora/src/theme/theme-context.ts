/**
 * Theme context — issue #16.
 *
 * Kept in its own module so the provider component and the consumer hooks can
 * share it without a circular import. `null` default lets hooks detect a missing
 * provider and fail loudly.
 */
import { createContext } from 'react';

import type { Theme, ThemeMode, ThemePreference } from './theme';

export type ThemeContextValue = {
  /** The resolved theme (mode + palette) currently in effect. */
  theme: Theme;
  /** Convenience accessor for `theme.mode`. */
  mode: ThemeMode;
  /** The active preference ('system' follows the OS). */
  preference: ThemePreference;
  /** Update the preference. */
  setPreference: (preference: ThemePreference) => void;
  /** Toggle between an explicit light and dark mode (leaves 'system'). */
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
