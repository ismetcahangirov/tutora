import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

/**
 * Styled native `<select>`. A native control keeps keyboard, screen-reader, and
 * mobile behaviour correct for free; the wrapper only supplies the chevron and
 * token-based chrome. Pass options as children.
 */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-11 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-sm text-foreground shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}
