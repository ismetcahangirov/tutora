import type { MetadataRoute } from 'next';

import { env } from '@shared/config/env';

/** Allow-all robots policy pointing crawlers at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  const host = env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
