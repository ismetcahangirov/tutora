import type { ReactNode } from 'react';

import { cn } from '@shared/utils';

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

/** Centered content column with the site's standard horizontal gutters. */
export function Container({ children, className }: ContainerProps) {
  return <div className={cn('mx-auto w-full max-w-6xl px-6 sm:px-8', className)}>{children}</div>;
}
