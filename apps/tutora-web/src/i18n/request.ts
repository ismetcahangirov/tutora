import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

/**
 * Per-request i18n config (epic #81): resolves the active locale and loads its
 * message catalog. Falls back to the default locale for anything unsupported.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: ((await import(`../messages/${locale}.json`)) as { default: Record<string, unknown> })
      .default,
  };
});
