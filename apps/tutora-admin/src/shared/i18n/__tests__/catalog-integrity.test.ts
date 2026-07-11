import { describe, expect, it } from 'vitest';

import az from '../locales/az.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../languages';

const CATALOGS: Record<SupportedLanguage, unknown> = { az, en, ru };

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe('admin i18n catalogs (#83)', () => {
  it('every language exposes the same keys as English', () => {
    const baseKeys = flattenKeys(en).sort();
    expect(baseKeys.length).toBeGreaterThan(0);
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(flattenKeys(CATALOGS[lang] as Record<string, unknown>).sort()).toEqual(baseKeys);
    }
  });
});
