import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card, Section, SectionHeading } from '@shared/components';

import { SECTION_IDS } from '../constants';
import type { Testimonial } from '../types';

const HEADING_ID = 'testimonials-heading';
const STARS = [0, 1, 2, 3, 4];

/** Social proof: three verified user testimonials. */
export async function Testimonials() {
  const t = await getTranslations('testimonials');
  const items = t.raw('items') as Testimonial[];

  return (
    <Section id={SECTION_IDS.testimonials} surface ariaLabelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <ul className="mt-14 grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.name}>
            <Card className="flex h-full flex-col gap-5">
              <div className="flex items-center gap-1 text-accent" aria-hidden>
                {STARS.map((star) => (
                  <Star key={star} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="flex-1 text-base leading-relaxed text-foreground text-pretty">
                “{item.quote}”
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="size-10 shrink-0 rounded-full bg-primary-tint" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-foreground">{item.name}</span>
                  <span className="block text-sm text-muted-foreground">{item.role}</span>
                </span>
              </figcaption>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
