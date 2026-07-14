import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

/** The page's three views. */
export const PAYMENTS_TABS = ['plans', 'subscriptions', 'transactions'] as const;
export type PaymentsTab = (typeof PAYMENTS_TABS)[number];

/** Segmented tab bar to switch between plans, subscriptions, and transactions. */
export function PaymentsTabs({
  value,
  onChange,
}: {
  value: PaymentsTab;
  onChange: (tab: PaymentsTab) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t('payments.tabsLabel')}
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
    >
      {PAYMENTS_TABS.map((tab) => {
        const active = tab === value;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`payments.tabs.${tab}`)}
          </button>
        );
      })}
    </div>
  );
}
