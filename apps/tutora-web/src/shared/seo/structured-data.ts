import { APP_NAME, SOCIAL_LINKS } from '@shared/constants';

/** A JSON-LD node. Kept loose because schema.org graphs are open-ended. */
export type JsonLd = Record<string, unknown>;

type OrganizationInput = {
  siteUrl: string;
  description: string;
};

/** schema.org/Organization describing the Tutora brand. */
export function buildOrganizationJsonLd({ siteUrl, description }: OrganizationInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    description,
    sameAs: Object.values(SOCIAL_LINKS),
  };
}

type WebSiteInput = {
  siteUrl: string;
  description: string;
  locale: string;
};

/** schema.org/WebSite for the landing page. */
export function buildWebSiteJsonLd({ siteUrl, description, locale }: WebSiteInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: siteUrl,
    description,
    inLanguage: locale,
  };
}

/**
 * schema.org/FAQPage built from the FAQ section — makes the questions eligible
 * for rich results in search.
 */
export function buildFaqJsonLd(items: ReadonlyArray<{ question: string; answer: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
