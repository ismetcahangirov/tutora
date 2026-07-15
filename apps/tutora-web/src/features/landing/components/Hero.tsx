import { getTranslations } from 'next-intl/server';

import { Button, Container, Eyebrow } from '@shared/components';

import { SECTION_IDS } from '../constants';
import { HeroVisual } from './HeroVisual';

/** Above-the-fold value proposition, primary CTAs, and a preview visual. */
export async function Hero() {
  const t = await getTranslations('hero');

  return (
    <section id={SECTION_IDS.hero} className="pt-16 pb-20 sm:pt-24 sm:pb-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <Eyebrow>{t('badge')}</Eyebrow>
          <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            {t('subtitle')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={`#${SECTION_IDS.download}`} size="lg">
              {t('ctaPrimary')}
            </Button>
            <Button href={`#${SECTION_IDS.tutors}`} variant="outline" size="lg">
              {t('ctaSecondary')}
            </Button>
          </div>
          <p className="text-sm font-medium text-muted-foreground">{t('trustNote')}</p>
        </div>

        <HeroVisual />
      </Container>
    </section>
  );
}
