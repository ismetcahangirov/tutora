import { getLocales } from 'expo-localization';

import { toSupportedLanguage, type SupportedLanguage } from './languages';
import { getStoredLanguage } from './storage';

/**
 * Resolves the language to boot with (issue #82): a previously persisted choice
 * wins; otherwise the device locale is used; otherwise the default (az).
 */
export function detectInitialLanguage(): SupportedLanguage {
  const stored = getStoredLanguage();
  if (stored) {
    return toSupportedLanguage(stored);
  }
  const deviceLanguage = getLocales()[0]?.languageCode;
  return toSupportedLanguage(deviceLanguage);
}
