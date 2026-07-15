import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@/app/providers/AppProviders';
import { initSentry } from '@shared/observability/sentry';
import { applyThemeClass, useThemeStore } from '@shared/theme';

import App from './App.tsx';
import './index.css';

// Start crash reporting before the app mounts so early errors are captured.
initSentry();

// Reflect the persisted theme onto <html> before first paint to avoid a flash.
applyThemeClass(useThemeStore.getState().mode);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
