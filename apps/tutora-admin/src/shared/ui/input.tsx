import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

/** Text input on design tokens. 44px height satisfies the WCAG tap-target minimum. */
export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type ?? 'text'}
      className={cn(
        'flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
