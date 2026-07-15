'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@shared/utils';

const LOCALE_CODES: Record<string, string> = {
  az: 'AZ',
  en: 'EN',
  ru: 'RU',
};

const LOCALE_NAMES: Record<string, string> = {
  az: 'Azərbaycan dili',
  en: 'English',
  ru: 'Русский',
};

/**
 * Language dropdown for the header — a Globe trigger opens a menu of az / en / ru,
 * swapping the locale segment while keeping the current path (epic #81). Closes on
 * outside click and Escape.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Dismiss on outside click or Escape (external listeners → effect with cleanup).
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const selectLocale = (target: string) => {
    close();
    if (target !== locale) router.replace(pathname, { locale: target });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('selectLanguage')}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        <Globe className="size-4 text-muted-foreground" aria-hidden />
        {LOCALE_CODES[locale]}
        <ChevronDown
          className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="menu"
          aria-label={t('selectLanguage')}
          className="absolute right-0 z-50 mt-2 min-w-[184px] rounded-md border border-border bg-card p-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
        >
          {routing.locales.map((target) => {
            const isActive = target === locale;
            return (
              <li key={target} role="none">
                <button
                  type="button"
                  role="menuitem"
                  aria-current={isActive || undefined}
                  onClick={() => selectLocale(target)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-sm transition-colors',
                    isActive
                      ? 'font-semibold text-primary'
                      : 'text-foreground hover:bg-muted focus-visible:bg-muted',
                    'focus-visible:outline-none',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-xs font-semibold text-muted-foreground">
                      {LOCALE_CODES[target]}
                    </span>
                    {LOCALE_NAMES[target]}
                  </span>
                  {isActive ? <Check className="size-4" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
