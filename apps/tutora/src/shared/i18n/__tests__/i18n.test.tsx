/**
 * i18n foundation (issue #82) — catalog integrity, locale narrowing, translated
 * rendering, and language switching with MMKV persistence.
 */
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils';
import { i18n } from '@/shared/i18n';

import az from '../locales/az.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import { SUPPORTED_LANGUAGES, type SupportedLanguage, toSupportedLanguage } from '../languages';
import { LanguageSwitcher } from '../language-switcher';
import { getStoredLanguage } from '../storage';

const CATALOGS: Record<SupportedLanguage, unknown> = { az, en, ru };

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

function Probe() {
  const { t } = useTranslation();
  return <Text>{t('auth.screen.title')}</Text>;
}

describe('i18n catalogs (#82)', () => {
  it('every language exposes the same keys as English', () => {
    const baseKeys = flattenKeys(en).sort();
    expect(baseKeys.length).toBeGreaterThan(0);
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(flattenKeys(CATALOGS[lang] as Record<string, unknown>).sort()).toEqual(baseKeys);
    }
  });
});

describe('toSupportedLanguage (#82)', () => {
  it('narrows regional locales to their base language', () => {
    expect(toSupportedLanguage('ru-RU')).toBe('ru');
    expect(toSupportedLanguage('en_US')).toBe('en');
  });

  it('falls back to the default (az) for unknown or missing locales', () => {
    expect(toSupportedLanguage('fr')).toBe('az');
    expect(toSupportedLanguage(null)).toBe('az');
    expect(toSupportedLanguage(undefined)).toBe('az');
  });
});

describe('language selection (#82)', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders translated copy for the selected language', async () => {
    await renderWithProviders(<Probe />, { language: 'az' });
    expect(screen.getByText(az.auth.screen.title)).toBeTruthy();
  });

  it('switches the active language and persists the choice to MMKV', async () => {
    await renderWithProviders(<LanguageSwitcher />, { language: 'en' });

    await fireEvent.press(screen.getByRole('button', { name: 'Русский' }));

    await waitFor(() => expect(i18n.language).toBe('ru'));
    expect(getStoredLanguage()).toBe('ru');
  });
});
