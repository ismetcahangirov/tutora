import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

/** Form label. Pair its `htmlFor` with the control's `id` for a11y. */
export function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}
