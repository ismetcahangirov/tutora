import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

/**
 * Generic centered status view for empty / error / forbidden / not-found states.
 * Pure and presentational — callers supply translated copy and an optional action.
 */
export function StatusView({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
