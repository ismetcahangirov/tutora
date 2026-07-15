import type { ReactNode } from 'react';

import { getTranslations } from 'next-intl/server';

import { PhoneFrame, Section, SectionHeading } from '@shared/components';

import { SECTION_IDS } from '../constants';
import { StoreBadges } from './StoreBadges';

const HEADING_ID = 'app-heading';

type Screen = { title: string; subtitle: string };

/** App screens showcase: three phone mockups with captions and store badges. */
export async function AppShowcase() {
  const t = await getTranslations('app');
  const screens = t.raw('screens') as Screen[];
  const mocks = [
    <SearchMock key="search" />,
    <ProfileMock key="profile" />,
    <ChatMock key="chat" />,
  ];

  return (
    <Section id={SECTION_IDS.app} ariaLabelledby={HEADING_ID}>
      <SectionHeading
        id={HEADING_ID}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {screens.map((screen, index) => (
          <li key={screen.title} className="flex flex-col items-center gap-5 text-center">
            <PhoneFrame>{mocks[index]}</PhoneFrame>
            <div>
              <h3 className="text-base font-semibold text-foreground">{screen.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{screen.subtitle}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-14 flex justify-center">
        <StoreBadges iosLabel={t('iosLabel')} androidLabel={t('androidLabel')} />
      </div>
    </Section>
  );
}

/** Shared building block for the abstract mock screens. */
function MockScreen({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col gap-3 p-4">{children}</div>;
}

function Bar({ className }: { className?: string }) {
  return <span className={`block rounded-full bg-border ${className ?? ''}`} />;
}

function SearchMock() {
  return (
    <MockScreen>
      <div className="flex h-9 items-center gap-2 rounded-lg bg-card px-3">
        <span className="size-3.5 rounded-full bg-primary" />
        <Bar className="h-2 w-24" />
      </div>
      <div className="flex gap-2">
        <span className="h-6 w-14 rounded-full bg-primary-tint" />
        <span className="h-6 w-12 rounded-full bg-card" />
        <span className="h-6 w-16 rounded-full bg-card" />
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3 rounded-lg bg-card p-3">
          <span className="size-9 shrink-0 rounded-full bg-primary-tint" />
          <div className="flex-1 space-y-1.5">
            <Bar className="h-2 w-20" />
            <Bar className="h-2 w-14" />
          </div>
          <span className="h-5 w-8 rounded bg-primary-tint" />
        </div>
      ))}
    </MockScreen>
  );
}

function ProfileMock() {
  return (
    <MockScreen>
      <div className="flex flex-col items-center gap-2 rounded-lg bg-card p-4">
        <span className="size-14 rounded-full bg-primary-tint" />
        <Bar className="h-2.5 w-24" />
        <Bar className="h-2 w-16" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((tile) => (
          <span key={tile} className="h-12 rounded-lg bg-card" />
        ))}
      </div>
      <div className="space-y-2 rounded-lg bg-card p-3">
        <Bar className="h-2 w-full" />
        <Bar className="h-2 w-5/6" />
        <Bar className="h-2 w-2/3" />
      </div>
      <span className="mt-auto block h-9 rounded-lg bg-primary" />
    </MockScreen>
  );
}

function ChatMock() {
  return (
    <MockScreen>
      <div className="flex items-center gap-2 rounded-lg bg-card p-2.5">
        <span className="size-8 rounded-full bg-primary-tint" />
        <Bar className="h-2 w-20" />
      </div>
      <span className="max-w-[70%] self-start rounded-2xl rounded-tl-sm bg-card px-3 py-3" />
      <span className="h-9 max-w-[60%] self-end rounded-2xl rounded-tr-sm bg-primary" />
      <span className="h-8 max-w-[75%] self-start rounded-2xl rounded-tl-sm bg-card" />
      <div className="mt-auto flex h-9 items-center gap-2 rounded-full bg-card px-3">
        <Bar className="h-2 flex-1" />
        <span className="size-6 rounded-full bg-primary" />
      </div>
    </MockScreen>
  );
}
