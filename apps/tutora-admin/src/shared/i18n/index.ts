/** Public i18n surface for the admin panel (epic #81). */
export { default as i18n, resources } from './config';
export { I18nProvider } from './i18n-provider';
export { LanguageSwitcher } from './LanguageSwitcher';
export { useLanguage, type UseLanguage } from './use-language';
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  toSupportedLanguage,
  type SupportedLanguage,
} from './languages';
