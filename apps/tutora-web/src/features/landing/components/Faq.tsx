import { ChevronDown } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Section, SectionHeading } from '@shared/components';
import { buildFaqJsonLd, JsonLdScript } from '@shared/seo';

import { SECTION_IDS } from '../constants';
import type { FaqItem } from '../types';

const HEADING_ID = 'faq-heading';

/**
 * FAQ accordion built on native `<details>`/`<summary>` — fully accessible and
 * ships zero JavaScript. Emits FAQPage structured data from the same content.
 */
export async function Faq() {
  const t = await getTranslations('faq');
  const items = t.raw('items') as FaqItem[];

  return (
    <Section id={SECTION_IDS.faq} ariaLabelledby={HEADING_ID}>
      <JsonLdScript data={buildFaqJsonLd(items)} />
      <SectionHeading
        id={HEADING_ID}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <div className="mx-auto mt-12 max-w-3xl divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {items.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              {item.question}
              <ChevronDown
                className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
