import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

import { TAXONOMY_KINDS, type TaxonomyKind } from '../types';

/** Segmented tab bar to switch the active taxonomy kind. */
export function TaxonomyTabs({
  value,
  onChange,
}: {
  value: TaxonomyKind;
  onChange: (kind: TaxonomyKind) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t('taxonomy.tabsLabel')}
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
    >
      {TAXONOMY_KINDS.map((kind) => {
        const active = kind === value;
        return (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(kind)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`taxonomy.kinds.${kind}`)}
          </button>
        );
      })}
    </div>
  );
}
