import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';

import { useGoogleSignInButton } from '../hooks/useGoogleSignInButton';

/**
 * Renders the Google Identity sign-in button. Falls back to a clear message when
 * the client ID is not configured or the GIS script fails to load, so the login
 * screen never shows a dead area.
 */
export function GoogleSignInButton({
  onCredential,
  disabled = false,
}: {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { containerRef, status, isConfigured } = useGoogleSignInButton(onCredential);

  if (!isConfigured) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t('auth.googleNotConfigured')}
      </p>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-11 flex-col items-center gap-2',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <div ref={containerRef} aria-busy={status === 'idle'} />
      {status === 'error' ? (
        <p className="text-sm text-destructive" role="alert">
          {t('auth.googleLoadError')}
        </p>
      ) : null}
    </div>
  );
}
