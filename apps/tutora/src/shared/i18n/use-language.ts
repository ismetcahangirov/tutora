import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES, toSupportedLanguage, type SupportedLanguage } from './languages';
import { setStoredLanguage } from './storage';

export type UseLanguage = {
  /** The active language, narrowed to a supported one. */
  language: SupportedLanguage;
  supportedLanguages: readonly SupportedLanguage[];
  /** Switches language and persists the choice to MMKV. */
  setLanguage: (language: SupportedLanguage) => void;
};

/**
 * Read/change the active language (issue #82). The choice is persisted so it
 * survives restarts; `detectInitialLanguage` reads it back on next launch.
 */
export function useLanguage(): UseLanguage {
  const { i18n } = useTranslation();

  const setLanguage = useCallback(
    (language: SupportedLanguage) => {
      setStoredLanguage(language);
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
