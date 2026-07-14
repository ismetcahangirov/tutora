import { useTranslation } from 'react-i18next';

import { Page, PageHeader } from '@shared/components';
import { Card } from '@shared/ui';

import { NotificationComposer } from '../components/NotificationComposer';

/** Notifications & push composer (#66): compose, segment, and send a broadcast. */
export function NotificationsPage() {
  const { t } = useTranslation();

  return (
    <Page>
      <PageHeader title={t('notifications.title')} description={t('notifications.subtitle')} />
      <Card className="p-6">
        <NotificationComposer />
      </Card>
    </Page>
  );
}
