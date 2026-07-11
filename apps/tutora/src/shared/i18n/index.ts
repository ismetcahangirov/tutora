/** Public i18n surface for the mobile app (issue #82). */
export { default as i18n, resources } from './config';
export { I18nProvider } from './i18n-provider';
export { useLanguage, type UseLanguage } from './use-language';
export { LanguageSwitcher } from './language-switcher';
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  toSupportedLanguage,
  type SupportedLanguage,
} from './languages';
export { detectInitialLanguage } from './detect-language';
export { getStoredLanguage, setStoredLanguage } from './storage';
