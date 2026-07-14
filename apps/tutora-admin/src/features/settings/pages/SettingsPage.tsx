import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { Page, PageHeader } from '@shared/components';

import { ConfigPanel } from '../components/ConfigPanel';
import { FlagsPanel } from '../components/FlagsPanel';
import { SETTINGS_TABS, SettingsTabs, type SettingsTab } from '../components/SettingsTabs';

/**
 * Feature flags & system settings (#70): manage progressive-rollout flags and
 * global JSON configuration across two tabs. The active tab seeds from `?tab=`
 * so a deep link lands on the right view. Every change here is mirrored to the
 * audit trail (#71), visible under the Logs section.
 */
export function SettingsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<SettingsTab>(
    () => SETTINGS_TABS.find((option) => option === searchParams.get('tab')) ?? 'flags',
  );

  return (
    <Page>
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <div className="space-y-4">
        <SettingsTabs value={tab} onChange={setTab} />

        {tab === 'flags' ? <FlagsPanel /> : null}
        {tab === 'config' ? <ConfigPanel /> : null}
      </div>
    </Page>
  );
}
