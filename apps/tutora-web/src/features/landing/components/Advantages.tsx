import {
  Columns3,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card, IconBadge, Section, SectionHeading } from '@shared/components';

import { SECTION_IDS } from '../constants';
import type { FeatureItem } from '../types';

const HEADING_ID = 'advantages-heading';

const ADVANTAGE_ICONS: LucideIcon[] = [
  SlidersHorizontal,
  Columns3,
  ShieldCheck,
  Star,
  MessageCircle,
  Wallet,
];

/** Key advantages — the capabilities that make choosing a tutor confident. */
export async function Advantages() {
  const t = await getTranslations('advantages');
  const items = t.raw('items') as FeatureItem[];

  return (
    <Section id={SECTION_IDS.advantages} surface ariaLabelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const Icon = ADVANTAGE_ICONS[index] ?? Star;
          return (
            <li key={item.title}>
              <Card className="h-full">
                <IconBadge icon={Icon} />
                <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
