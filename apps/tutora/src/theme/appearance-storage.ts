/**
 * Appearance preference persistence (student epic #40, #49).
 *
 * The `ThemeProvider` deliberately ships without built-in persistence — it takes
 * an `initialPreference` and emits `onPreferenceChange`. This thin MMKV wrapper is
 * the storage seam it anticipated: the root layout seeds the provider from
 * `getStoredAppearance()` and persists every change via `setStoredAppearance`, so
 * the student's light/dark/system choice survives app restarts. Kept out of the
 * theme barrel so importing tokens/hooks stays free of a storage dependency.
 */
import { storage } from '@/shared/lib';

import type { ThemePreference } from './theme';

const APPEARANCE_KEY = 'settings.appearance';
const VALID_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** The persisted preference, or `undefined` when unset or corrupt (→ default). */
export function getStoredAppearance(): ThemePreference | undefined {
  const stored = storage.getString(APPEARANCE_KEY);
  return stored && (VALID_PREFERENCES as readonly string[]).includes(stored)
    ? (stored as ThemePreference)
    : undefined;
}

export function setStoredAppearance(preference: ThemePreference): void {
  storage.set(APPEARANCE_KEY, preference);
}
