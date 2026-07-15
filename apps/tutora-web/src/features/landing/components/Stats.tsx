import { getTranslations } from 'next-intl/server';

import { Container } from '@shared/components';

import { SECTION_IDS } from '../constants';
import type { Stat } from '../types';

const HEADING_ID = 'stats-heading';

/** Solid indigo band of headline platform metrics (no gradients). */
export async function Stats() {
  const t = await getTranslations('stats');
  const items = t.raw('items') as Stat[];

  return (
    <section id={SECTION_IDS.stats} aria-labelledby={HEADING_ID} className="py-8">
      <Container>
        <div className="rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12">
          <h2
            id={HEADING_ID}
            className="text-center text-2xl font-bold tracking-tight text-balance"
          >
            {t('title')}
          </h2>
          <dl className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.label} className="text-center">
                <dt className="sr-only">{item.label}</dt>
                <dd>
                  <span className="block text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                    {item.value}
                  </span>
                  <span className="mt-2 block text-sm font-medium text-primary-foreground/80">
                    {item.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
