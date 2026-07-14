import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@shared/ui';
import { cn } from '@shared/lib/cn';

/**
 * A single headline metric: label, formatted value, and an accent icon. Set
 * `emphasis` to flag a metric that needs attention (e.g. a moderation backlog).
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  emphasis = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  emphasis?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            emphasis ? 'bg-warning/15 text-warning' : 'bg-accent text-accent-foreground',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
