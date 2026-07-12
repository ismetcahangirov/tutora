import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n.config';

/** Namespaces that must exist and stay in lockstep across every language. */
const NAMESPACES = ['validation', 'mail', 'notifications'] as const;

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

function loadKeys(lang: string, namespace: string): string[] {
  const file = join(__dirname, '..', lang, `${namespace}.json`);
  return flattenKeys(JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>).sort();
}

describe('i18n catalog integrity', () => {
  const otherLanguages = SUPPORTED_LANGUAGES.filter((lang) => lang !== DEFAULT_LANGUAGE);

  it.each(NAMESPACES)(
    'every language exposes the same keys as the default for "%s"',
    (namespace) => {
      const baseKeys = loadKeys(DEFAULT_LANGUAGE, namespace);
      expect(baseKeys.length).toBeGreaterThan(0);
      for (const lang of otherLanguages) {
        expect(loadKeys(lang, namespace)).toEqual(baseKeys);
      }
    },
  );
});
