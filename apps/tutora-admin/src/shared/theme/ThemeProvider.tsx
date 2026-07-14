import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { applyThemeClass, useThemeStore } from './theme-store';

/**
 * Keeps <html> in sync with the theme store. Re-applies on mode change and, when
 * the mode is "system", follows OS preference changes live (external system →
 * effect with cleanup).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    applyThemeClass(mode);
    if (mode !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeClass('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  return <>{children}</>;
}
