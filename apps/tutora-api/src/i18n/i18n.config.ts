import { join } from 'node:path';

/**
 * Languages the API can resolve and translate into. Azerbaijani is the default
 * and the fallback for any unresolved or unsupported request locale (epic #81).
 */
export const SUPPORTED_LANGUAGES = ['az', 'en', 'ru'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'az';

/**
 * Absolute path to the folder holding the per-language catalogs (`az/`, `en/`,
 * `ru/`). `__dirname` resolves to this `i18n` folder under `src` in dev/test and
 * under `dist` in production, where nest-cli copies the JSON as build assets.
 */
export const I18N_LOADER_PATH = join(__dirname);

/** Narrows an arbitrary locale string to a supported language, or the default. */
export function toSupportedLanguage(locale: string | null | undefined): SupportedLanguage {
  const base = locale?.toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.find((lang) => lang === base) ?? DEFAULT_LANGUAGE;
}
