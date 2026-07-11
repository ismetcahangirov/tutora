/**
 * Theme definitions — issue #16.
 *
 * A `Theme` is the mode plus its resolved color palette. Mode-independent tokens
 * (spacing, radius, typography, shadows) are imported directly by components and
 * are intentionally not part of this object.
 */
import { darkColors, lightColors, type ColorTokens } from './tokens';

export type ThemeMode = 'light' | 'dark';

/** User preference: follow the OS, or force a fixed mode. */
export type ThemePreference = 'system' | 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  colors: ColorTokens;
};

export const lightTheme: Theme = { mode: 'light', colors: lightColors };
export const darkTheme: Theme = { mode: 'dark', colors: darkColors };

export const themes: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};
