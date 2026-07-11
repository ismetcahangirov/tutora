import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing for the landing site (epic #81). Azerbaijani is the default;
 * every route is locale-prefixed (`/az`, `/en`, `/ru`).
 */
export const routing = defineRouting({
  locales: ['az', 'en', 'ru'],
  defaultLocale: 'az',
});
