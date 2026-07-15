import type { ReactNode } from 'react';

import { cn } from '@shared/utils';

type CardProps = {
  children: ReactNode;
  className?: string;
};

/** Flat, low-elevation surface card: 1px border, 16px radius, soft shadow. */
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
