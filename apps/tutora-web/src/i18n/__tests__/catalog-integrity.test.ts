import { describe, expect, it } from 'vitest';

import az from '@/messages/az.json';
import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import { routing } from '../routing';

const CATALOGS: Record<string, unknown> = { az, en, ru };

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe('landing i18n catalogs (#83)', () => {
  it('every locale exposes the same keys as English', () => {
    const baseKeys = flattenKeys(en).sort();
    expect(baseKeys.length).toBeGreaterThan(0);
    for (const locale of routing.locales) {
      expect(flattenKeys(CATALOGS[locale] as Record<string, unknown>).sort()).toEqual(baseKeys);
    }
  });
});
