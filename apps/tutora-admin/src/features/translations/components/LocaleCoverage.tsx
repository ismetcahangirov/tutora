import { useTranslation } from 'react-i18next';

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@shared/i18n/languages';
import { Badge } from '@shared/ui';

import type { TranslationValues } from '../types';

/** Whether a locale carries a non-empty value. */
function isFilled(values: TranslationValues, locale: string): boolean {
  const value = values[locale as keyof TranslationValues];
  return typeof value === 'string' && value.length > 0;
}

/**
 * A compact row of per-locale badges showing which languages a key is
 * translated into — a filled badge per present locale, a muted one per gap. Each
 * badge is labelled with its state so coverage is not signalled by colour alone.
 */
export function LocaleCoverage({ values }: { values: TranslationValues }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1">
      {SUPPORTED_LANGUAGES.map((locale) => {
        const filled = isFilled(values, locale);
        const label = t(
          filled ? 'translations.coverage.present' : 'translations.coverage.missing',
          {
            language: LANGUAGE_LABELS[locale],
          },
        );
        return (
          <Badge
            key={locale}
            variant={filled ? 'success' : 'neutral'}
            aria-label={label}
            title={label}
          >
            {locale.toUpperCase()}
          </Badge>
        );
      })}
    </div>
  );
}
