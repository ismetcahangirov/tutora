import { Star } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { MAX_RATING } from '../types';

/**
 * Read-only star rating. Renders {@link MAX_RATING} stars, filling `value` of
 * them. The numeric value is exposed to assistive tech via `aria-label`.
 */
export function StarRating({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: MAX_RATING }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            'size-4',
            index < value ? 'fill-warning text-warning' : 'text-muted-foreground/40',
          )}
        />
      ))}
    </div>
  );
}
