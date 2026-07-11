'use client';

import { useLocale, useTranslations } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LANGUAGE_LABELS: Record<string, string> = {
  az: 'Azərbaycan dili',
  en: 'English',
  ru: 'Русский',
};

/** az / en / ru switcher — swaps the locale segment while keeping the path (epic #81). */
export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');

  return (
    <div role="group" aria-label={t('selectLanguage')}>
      {routing.locales.map((target) => (
        <button
          key={target}
          type="button"
          aria-pressed={target === locale}
          onClick={() => router.replace(pathname, { locale: target })}
        >
          {LANGUAGE_LABELS[target]}
        </button>
      ))}
    </div>
  );
}
