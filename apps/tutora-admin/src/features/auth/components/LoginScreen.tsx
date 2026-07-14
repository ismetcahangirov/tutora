import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';

import { Brand } from '@shared/components';
import { Card, CardContent } from '@shared/ui';
import { LanguageSwitcher } from '@shared/i18n';
import { ThemeToggle } from '@shared/theme';

import { useAuthStore } from '../store/auth-store';
import { GoogleSignInButton } from './GoogleSignInButton';

const KNOWN_ERRORS = new Set(['not_authorized', 'sign_in_failed', 'network_error']);

type LocationState = { from?: { pathname?: string } } | null;

/** Public sign-in screen. Google-only auth; access is limited to admins. */
export function LoginScreen() {
  const { t } = useTranslation();
  const location = useLocation();

  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const isSigningIn = useAuthStore((state) => state.isSigningIn);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);

  const handleCredential = useCallback(
    (idToken: string) => {
      void signInWithGoogle(idToken);
    },
    [signInWithGoogle],
  );

  if (status === 'authenticated') {
    const from = (location.state as LocationState)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const errorMessage = error && KNOWN_ERRORS.has(error) ? t(`auth.errors.${error}`) : null;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-secondary px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <Brand />
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold text-foreground">{t('auth.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.subtitle')}</p>
          </div>

          <GoogleSignInButton onCredential={handleCredential} disabled={isSigningIn} />

          {errorMessage ? (
            <p className="text-center text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">{t('auth.adminOnly')}</p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </main>
  );
}
