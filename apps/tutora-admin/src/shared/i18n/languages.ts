/**
 * Supported languages for the admin panel (epic #81). Azerbaijani is the default
 * and the fallback for any unresolved locale.
 */
export const SUPPORTED_LANGUAGES = ['az', 'en', 'ru'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'az';

/** Autonyms — each language names itself, independent of the active language. */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  az: 'Azərbaycan dili',
  en: 'English',
  ru: 'Русский',
};

/** Narrows an arbitrary locale (e.g. `en-US`) to a supported language, or the default. */
export function toSupportedLanguage(locale: string | null | undefined): SupportedLanguage {
  const base = locale?.toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.find((lang) => lang === base) ?? DEFAULT_LANGUAGE;
}
