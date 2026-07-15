import { Check, X } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Section, SectionHeading } from '@shared/components';
import { cn } from '@shared/utils';

import { SECTION_IDS } from '../constants';
import type { ComparisonRow } from '../types';

const HEADING_ID = 'why-heading';

/** Problem vs. solution: the fragmented old way beside the structured Tutora way. */
export async function ProblemSolution() {
  const t = await getTranslations('why');
  const rows = t.raw('rows') as ComparisonRow[];

  return (
    <Section id={SECTION_IDS.why} surface ariaLabelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <ComparisonCard
          heading={t('problemHeading')}
          items={rows.map((row) => row.problem)}
          tone="problem"
        />
        <ComparisonCard
          heading={t('solutionHeading')}
          items={rows.map((row) => row.solution)}
          tone="solution"
        />
      </div>
    </Section>
  );
}

type ComparisonCardProps = {
  heading: string;
  items: string[];
  tone: 'problem' | 'solution';
};

function ComparisonCard({ heading, items, tone }: ComparisonCardProps) {
  const isSolution = tone === 'solution';
  const Icon = isSolution ? Check : X;

  return (
    <div
      className={cn(
        'rounded-lg border p-6 sm:p-8',
        isSolution ? 'border-primary/30 bg-primary-tint' : 'border-border bg-card',
      )}
    >
      <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full',
                isSolution ? 'bg-primary text-primary-foreground' : 'bg-muted text-subtle',
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <span
              className={cn(
                'text-sm leading-relaxed',
                isSolution ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
