import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { Page, PageHeader } from '@shared/components';

import { PaymentsTabs, PAYMENTS_TABS, type PaymentsTab } from '../components/PaymentsTabs';
import { PlansPanel } from '../components/PlansPanel';
import { SubscriptionsPanel } from '../components/SubscriptionsPanel';
import { TransactionsPanel } from '../components/TransactionsPanel';

/**
 * Payments & subscription plans (#68): manage the plan catalogue and its
 * entitlements, oversee subscriptions, and settle or refund transactions —
 * split across three tabs. The active tab seeds from `?tab=` so a deep link
 * (e.g. "show this user's transactions") lands on the right view.
 */
export function PaymentsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<PaymentsTab>(
    () => PAYMENTS_TABS.find((option) => option === searchParams.get('tab')) ?? 'plans',
  );

  return (
    <Page>
      <PageHeader title={t('payments.title')} description={t('payments.subtitle')} />

      <div className="space-y-4">
        <PaymentsTabs value={tab} onChange={setTab} />

        {tab === 'plans' ? <PlansPanel /> : null}
        {tab === 'subscriptions' ? <SubscriptionsPanel /> : null}
        {tab === 'transactions' ? <TransactionsPanel /> : null}
      </div>
    </Page>
  );
}
