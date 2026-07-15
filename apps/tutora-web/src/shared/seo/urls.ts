/**
 * URL helpers for locale-prefixed routing. The landing uses next-intl's default
 * `always` prefix, so every locale (including the default) is reachable at
 * `/{locale}`. Kept pure and framework-free so they are trivially unit-tested.
 */

/** Absolute-from-root path for a locale, e.g. `localePath('en')` → `/en`. */
export function localePath(locale: string, path = ''): string {
  const suffix = path && path !== '/' ? `/${path.replace(/^\/+/, '')}` : '';
  return `/${locale}${suffix}`;
}

/**
 * `alternates.languages` map for `hreflang` tags: one entry per locale plus an
 * `x-default` pointing at the default locale.
 */
export function buildLanguageAlternates(
  locales: readonly string[],
  defaultLocale: string,
  path = '',
): Record<string, string> {
  const languages = Object.fromEntries(locales.map((locale) => [locale, localePath(locale, path)]));
  return { ...languages, 'x-default': localePath(defaultLocale, path) };
}
