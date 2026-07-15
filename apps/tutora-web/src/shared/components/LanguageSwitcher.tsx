'use client';

import { useLocale, useTranslations } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@shared/utils';

const LOCALE_LABELS: Record<string, string> = {
  az: 'AZ',
  en: 'EN',
  ru: 'RU',
};

const LOCALE_FULL: Record<string, string> = {
  az: 'Azərbaycan dili',
  en: 'English',
  ru: 'Русский',
};

/** Compact az / en / ru switcher for the header — swaps the locale segment while
 *  keeping the current path (epic #81). */
export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');

  return (
    <div
      role="group"
      aria-label={t('selectLanguage')}
      className="inline-flex items-center rounded-md border border-border bg-card p-0.5"
    >
      {routing.locales.map((target) => {
        const isActive = target === locale;
        return (
          <button
            key={target}
            type="button"
            aria-pressed={isActive}
            aria-label={LOCALE_FULL[target]}
            onClick={() => router.replace(pathname, { locale: target })}
            className={cn(
              'rounded-[10px] px-2.5 py-1 text-xs font-semibold transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {LOCALE_LABELS[target]}
          </button>
        );
      })}
    </div>
  );
}
