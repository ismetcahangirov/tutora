import { describe, expect, it } from 'vitest';

import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from '../structured-data';

const SITE_URL = 'https://tutora.az';
const DESCRIPTION = 'Find trusted tutors fast.';

describe('buildOrganizationJsonLd', () => {
  it('produces a valid Organization node', () => {
    const jsonLd = buildOrganizationJsonLd({ siteUrl: SITE_URL, description: DESCRIPTION });

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Organization');
    expect(jsonLd.url).toBe(SITE_URL);
    expect(jsonLd.logo).toBe(`${SITE_URL}/icon.svg`);
    expect(Array.isArray(jsonLd.sameAs)).toBe(true);
  });
});

describe('buildWebSiteJsonLd', () => {
  it('produces a WebSite node carrying the active locale', () => {
    const jsonLd = buildWebSiteJsonLd({
      siteUrl: SITE_URL,
      description: DESCRIPTION,
      locale: 'az',
    });

    expect(jsonLd['@type']).toBe('WebSite');
    expect(jsonLd.inLanguage).toBe('az');
    expect(jsonLd.url).toBe(SITE_URL);
  });
});

describe('buildFaqJsonLd', () => {
  it('maps each item to a Question/Answer pair', () => {
    const jsonLd = buildFaqJsonLd([
      { question: 'Is it free?', answer: 'Yes.' },
      { question: 'Online?', answer: 'Yes, or in person.' },
    ]);

    expect(jsonLd['@type']).toBe('FAQPage');
    const mainEntity = jsonLd.mainEntity as Array<Record<string, unknown>>;
    expect(mainEntity).toHaveLength(2);
    expect(mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'Is it free?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes.' },
    });
  });
});
