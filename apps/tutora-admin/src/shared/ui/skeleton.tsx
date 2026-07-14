import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

/** Loading placeholder. Uses `animate-pulse`; disabled under reduce-motion by the base reset. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
