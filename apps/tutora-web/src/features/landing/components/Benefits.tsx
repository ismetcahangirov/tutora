import { Check } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button, Eyebrow, Section } from '@shared/components';
import { cn } from '@shared/utils';

import { SECTION_IDS } from '../constants';
import { BenefitsVisual } from './BenefitsVisual';

type BenefitsProps = {
  /** i18n namespace + audience variant. */
  namespace: 'tutors' | 'students';
  id: string;
  /** Tints the section with the muted surface to alternate the page rhythm. */
  surface?: boolean;
  /** Places the visual before the copy on large screens. */
  reverse?: boolean;
};

/** Audience-specific benefits block (tutors or students) with a preview panel. */
export async function Benefits({ namespace, id, surface = false, reverse = false }: BenefitsProps) {
  const t = await getTranslations(namespace);
  const headingId = `${namespace}-heading`;
  const benefits = t.raw('benefits') as string[];

  return (
    <Section id={id} surface={surface} ariaLabelledby={headingId}>
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className={cn('flex flex-col items-start gap-5', reverse && 'lg:order-2')}>
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2
            id={headingId}
            className="text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
          >
            {t('title')}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
            {t('description')}
          </p>
          <ul className="mt-1 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-4" aria-hidden />
                </span>
                <span className="text-base leading-relaxed text-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
          <Button href={`#${SECTION_IDS.download}`} size="lg" className="mt-3">
            {t('cta')}
          </Button>
        </div>

        <div className={cn(reverse && 'lg:order-1')}>
          <BenefitsVisual variant={namespace === 'tutors' ? 'tutor' : 'student'} />
        </div>
      </div>
    </Section>
  );
}
