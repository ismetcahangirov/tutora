import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

import { CONTENT_TYPES, type ContentType } from '../types';

/** Segmented tab bar selecting the content type in view (landing / FAQ / blog). */
export function ContentTypeTabs({
  value,
  onChange,
}: {
  value: ContentType;
  onChange: (type: ContentType) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t('cms.tabsLabel')}
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
    >
      {CONTENT_TYPES.map((type) => {
        const active = type === value;
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(type)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`cms.types.${type}`)}
          </button>
        );
      })}
    </div>
  );
}
