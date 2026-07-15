import { getTranslations } from 'next-intl/server';

import { Button, Container, Logo } from '@shared/components';
import { LanguageSwitcher } from '@shared/components/LanguageSwitcher';

import { NAV_ITEMS, SECTION_IDS } from '../constants';

/** Sticky top navigation: brand, section links (desktop), language switcher, CTA. */
export async function Header() {
  const t = await getTranslations('nav');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <a href={`#${SECTION_IDS.hero}`} aria-label="Tutora" className="shrink-0">
          <Logo />
        </a>

        <nav aria-label={t('advantages')} className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button href={`#${SECTION_IDS.download}`} size="md" className="hidden sm:inline-flex">
            {t('getStarted')}
          </Button>
        </div>
      </Container>
    </header>
  );
}
