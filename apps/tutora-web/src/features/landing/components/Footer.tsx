import type { ComponentType, SVGProps } from 'react';

import { getTranslations } from 'next-intl/server';

import { Container, Logo } from '@shared/components';
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@shared/components/SocialIcons';
import { SOCIAL_LINKS } from '@shared/constants';

import { FOOTER_COLUMNS } from '../constants';

const SOCIAL_ICONS: Record<keyof typeof SOCIAL_LINKS, ComponentType<SVGProps<SVGSVGElement>>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedinIcon,
};

/** Site footer: brand, social links, navigation columns, and legal line. */
export async function Footer() {
  const t = await getTranslations('footer');
  const year = String(new Date().getFullYear());

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_2fr]">
          <div className="flex flex-col items-start gap-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t('tagline')}</p>
            <ul className="flex items-center gap-3">
              {(Object.keys(SOCIAL_ICONS) as Array<keyof typeof SOCIAL_LINKS>).map((key) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <li key={key}>
                    <a
                      href={SOCIAL_LINKS[key]}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={key}
                      className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Icon className="size-5" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.headingKey} aria-label={t(`columns.${column.headingKey}`)}>
                <h2 className="text-sm font-semibold text-foreground">
                  {t(`columns.${column.headingKey}`)}
                </h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.labelKey}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t(`links.${link.labelKey}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>{t('rights', { year })}</p>
          <p>{t('builtIn')}</p>
        </div>
      </Container>
    </footer>
  );
}
