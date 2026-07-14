/**
 * Theme store (issue #60). Persists an explicit light / dark / system choice and
 * drives the `.dark` class on <html>, which flips the token set in index.css.
 */
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_KEY = 'tutora.admin.theme';

function readMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** The concrete theme a mode resolves to right now. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

/** Reflect the resolved theme onto <html> so the CSS variables switch. */
export function applyThemeClass(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', resolveTheme(mode) === 'dark');
}

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Flip between light and dark based on what is currently showing. */
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: readMode(),
  setMode: (mode) => {
    localStorage.setItem(THEME_KEY, mode);
    applyThemeClass(mode);
    set({ mode });
  },
  toggle: () => {
    get().setMode(resolveTheme(get().mode) === 'dark' ? 'light' : 'dark');
  },
}));
