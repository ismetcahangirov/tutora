import type { MetadataRoute } from 'next';

import { env } from '@shared/config/env';
import { buildLanguageAlternates, localePath } from '@shared/seo';
import { routing } from '@/i18n/routing';

/**
 * Locale-aware sitemap: one entry per locale home, each carrying `hreflang`
 * alternates for the other locales so search engines index every variant.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const host = env.NEXT_PUBLIC_SITE_URL;
  const lastModified = new Date();

  const languages = Object.fromEntries(
    Object.entries(buildLanguageAlternates(routing.locales, routing.defaultLocale)).map(
      ([hreflang, path]) => [hreflang, `${host}${path}`],
    ),
  );

  return routing.locales.map((locale) => ({
    url: `${host}${localePath(locale)}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));
}
