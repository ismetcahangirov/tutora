import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { detectInitialLanguage } from './detect-language';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './languages';
import az from './locales/az.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

/**
 * The app's i18next instance (issue #82). Resources are bundled inline so init is
 * synchronous — the first render already has translations and tests need no async
 * setup. `escapeValue` is off since React Native renders no HTML.
 */
export const resources = {
  az: { translation: az },
  en: { translation: en },
  ru: { translation: ru },
} as const;

// Configure the global i18next singleton so `useTranslation()` works even
// without a provider (e.g. hooks in tests). `.use`/`.init` are instance methods.
// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
