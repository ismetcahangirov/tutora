import { FileQuestion } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusView } from './StatusView';

/** 404 state — the requested route does not exist. */
export function NotFoundView({ action }: { action?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <StatusView
      icon={FileQuestion}
      title={t('errors.notFound.title')}
      description={t('errors.notFound.description')}
      action={action}
    />
  );
}
