import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './languages';
import az from './locales/az.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

/**
 * The admin panel's i18next instance (epic #81). The browser language detector
 * resolves the locale from localStorage → the browser, falling back to
 * Azerbaijani, and caches the active choice back to localStorage.
 */
export const resources = {
  az: { translation: az },
  en: { translation: en },
  ru: { translation: ru },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    interpolation: { escapeValue: false },
  });

export default i18n;
