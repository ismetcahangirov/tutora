import type { ReactNode } from 'react';

import { cn } from '@shared/utils';

type PhoneFrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Decorative phone chrome (bezel + notch) wrapping a mocked app screen. Purely
 * presentational, so it is hidden from assistive tech; the surrounding section
 * carries the meaning. Built with CSS only — no image assets to download.
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative mx-auto w-full max-w-[280px] rounded-[2.5rem] border border-border bg-card p-3 shadow-[0_8px_24px_rgba(15,23,42,0.12)]',
        className,
      )}
    >
      <div className="absolute top-3 left-1/2 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-card" />
      <div className="relative aspect-[9/19] overflow-hidden rounded-[1.75rem] bg-surface">
        {children}
      </div>
    </div>
  );
}
