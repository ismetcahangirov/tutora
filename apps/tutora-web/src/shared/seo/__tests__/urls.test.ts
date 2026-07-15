import { describe, expect, it } from 'vitest';

import { buildLanguageAlternates, localePath } from '../urls';

describe('localePath', () => {
  it('builds a locale-prefixed root path', () => {
    expect(localePath('en')).toBe('/en');
    expect(localePath('az')).toBe('/az');
  });

  it('treats an empty or root path as the locale home', () => {
    expect(localePath('ru', '')).toBe('/ru');
    expect(localePath('ru', '/')).toBe('/ru');
  });

  it('appends a normalized sub-path without doubling slashes', () => {
    expect(localePath('en', 'blog')).toBe('/en/blog');
    expect(localePath('en', '/blog')).toBe('/en/blog');
  });
});

describe('buildLanguageAlternates', () => {
  const locales = ['az', 'en', 'ru'] as const;

  it('maps every locale plus x-default to its path', () => {
    expect(buildLanguageAlternates(locales, 'az')).toEqual({
      az: '/az',
      en: '/en',
      ru: '/ru',
      'x-default': '/az',
    });
  });

  it('points x-default at the provided default locale', () => {
    expect(buildLanguageAlternates(locales, 'en')['x-default']).toBe('/en');
  });
});
