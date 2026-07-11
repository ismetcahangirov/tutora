import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from './config';

/**
 * Makes the configured i18next instance available to the tree (issue #82). Mount
 * high — above the feature screens — so auth and onboarding copy translate.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
