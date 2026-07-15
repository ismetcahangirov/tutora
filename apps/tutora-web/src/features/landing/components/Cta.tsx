import { getTranslations } from 'next-intl/server';

import { Container } from '@shared/components';

import { SECTION_IDS } from '../constants';
import { StoreBadges } from './StoreBadges';

const HEADING_ID = 'cta-heading';

/** Closing call to action — the `#download` target with app store badges. */
export async function Cta() {
  const t = await getTranslations('cta');
  const tApp = await getTranslations('app');

  return (
    <section id={SECTION_IDS.download} aria-labelledby={HEADING_ID} className="py-20 sm:py-24">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2
            id={HEADING_ID}
            className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            {t('title')}
          </h2>
          <p className="max-w-2xl text-lg text-primary-foreground/85 text-pretty">
            {t('description')}
          </p>
          <StoreBadges
            iosLabel={tApp('iosLabel')}
            androidLabel={tApp('androidLabel')}
            className="mt-2 justify-center"
          />
        </div>
      </Container>
    </section>
  );
}
