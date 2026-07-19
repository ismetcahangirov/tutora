import { storage } from '@/shared/lib';

const LANGUAGE_KEY = 'settings.language';

export function getStoredLanguage(): string | undefined {
  return storage.getString(LANGUAGE_KEY);
}

export function setStoredLanguage(language: string): void {
  storage.set(LANGUAGE_KEY, language);
}
