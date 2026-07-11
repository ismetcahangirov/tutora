import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES, toSupportedLanguage, type SupportedLanguage } from './languages';

export type UseLanguage = {
  language: SupportedLanguage;
  supportedLanguages: readonly SupportedLanguage[];
  setLanguage: (language: SupportedLanguage) => void;
};

/**
 * Read/change the active language (epic #81). The language detector caches the
 * choice to localStorage, so it survives reloads.
 */
export function useLanguage(): UseLanguage {
  const { i18n } = useTranslation();

  const setLanguage = useCallback(
    (language: SupportedLanguage) => {
      void i18n.changeLanguage(language);
    },
    [i18n],
  );

  return {
    language: toSupportedLanguage(i18n.language),
    supportedLanguages: SUPPORTED_LANGUAGES,
    setLanguage,
  };
}
