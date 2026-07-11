/**
 * Theme public API — issues #9, #10, #11, #16.
 *
 * Import design tokens, theme objects, the provider, and hooks from here:
 *   `import { useTheme, spacing, radius } from '@/theme';`
 */
export * from './tokens';

export { lightTheme, darkTheme, themes } from './theme';
export type { Theme, ThemeMode, ThemePreference } from './theme';

export { ThemeProvider } from './theme-provider';
export type { ThemeProviderProps } from './theme-provider';

export { ThemeContext } from './theme-context';
export type { ThemeContextValue } from './theme-context';

export { useTheme, useColors, useThemeMode } from './use-theme';

export { useAppFonts } from './fonts';
