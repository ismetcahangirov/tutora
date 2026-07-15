import { CalendarCheck, ListChecks, MessagesSquare, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card, IconBadge, Section, SectionHeading } from '@shared/components';

import { SECTION_IDS } from '../constants';
import type { HowItWorksStep } from '../types';

const HEADING_ID = 'how-it-works-heading';

/** Icons paired with each step by index — presentational, so kept out of i18n. */
const STEP_ICONS: LucideIcon[] = [Search, ListChecks, MessagesSquare, CalendarCheck];

/** The four-step journey from search to first lesson. */
export async function HowItWorks() {
  const t = await getTranslations('howItWorks');
  const steps = t.raw('steps') as HowItWorksStep[];

  return (
    <Section id={SECTION_IDS.howItWorks} ariaLabelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Search;
          return (
            <li key={step.title}>
              <Card className="h-full">
                <div className="flex items-center justify-between">
                  <IconBadge icon={Icon} />
                  <span className="text-sm font-bold text-subtle tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
