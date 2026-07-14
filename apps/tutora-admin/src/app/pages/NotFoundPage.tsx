import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { NotFoundView } from '@shared/components';
import { Button } from '@shared/ui';

/** In-shell 404 for unknown authenticated routes. */
export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <NotFoundView
      action={
        <Button asChild variant="secondary">
          <Link to="/">{t('errors.notFound.backHome')}</Link>
        </Button>
      }
    />
  );
}
