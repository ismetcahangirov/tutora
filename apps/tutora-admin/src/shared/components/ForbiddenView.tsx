import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusView } from './StatusView';

/** 403 state — the signed-in user lacks permission for this area. */
export function ForbiddenView({ action }: { action?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <StatusView
      icon={ShieldAlert}
      title={t('errors.forbidden.title')}
      description={t('errors.forbidden.description')}
      action={action}
    />
  );
}
