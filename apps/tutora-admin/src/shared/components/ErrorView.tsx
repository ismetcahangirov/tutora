import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@shared/ui';

import { StatusView } from './StatusView';

/** Generic error state with a retry affordance. Used by the router errorElement. */
export function ErrorView({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <StatusView
      icon={AlertTriangle}
      title={t('errors.generic.title')}
      description={t('errors.generic.description')}
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            {t('errors.generic.retry')}
          </Button>
        ) : undefined
      }
    />
  );
}
