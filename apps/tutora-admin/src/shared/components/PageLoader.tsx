import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

/** Centered spinner for route/session loading. `fullScreen` fills the viewport. */
export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('flex flex-1 items-center justify-center', fullScreen && 'min-h-svh')}
    >
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
