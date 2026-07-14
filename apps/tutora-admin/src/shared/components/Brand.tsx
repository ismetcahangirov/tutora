import { GraduationCap } from 'lucide-react';

import { APP_NAME } from '@shared/constants';
import { cn } from '@shared/lib/cn';

/** Tutora Admin wordmark + logo mark. `collapsed` shows the mark only. */
export function Brand({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('flex items-center gap-2.5 font-semibold text-foreground', className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <GraduationCap className="size-5" aria-hidden="true" />
      </span>
      {!collapsed ? <span className="truncate text-base tracking-tight">{APP_NAME}</span> : null}
    </span>
  );
}
