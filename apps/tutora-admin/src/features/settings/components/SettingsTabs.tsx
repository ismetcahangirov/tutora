import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

/** The page's two views. */
export const SETTINGS_TABS = ['flags', 'config'] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

/** Segmented tab bar to switch between feature flags and system settings. */
export function SettingsTabs({
  value,
  onChange,
}: {
  value: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t('settings.tabsLabel')}
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
    >
      {SETTINGS_TABS.map((tab) => {
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
            {t(`settings.tabs.${tab}`)}
          </button>
        );
      })}
    </div>
  );
}
