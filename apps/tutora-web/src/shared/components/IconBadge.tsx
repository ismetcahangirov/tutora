import type { LucideIcon } from 'lucide-react';

import { cn } from '@shared/utils';

type IconBadgeProps = {
  icon: LucideIcon;
  className?: string;
};

/**
 * Tinted rounded square holding a single line icon. Rendered inside Server
 * Components, so the Lucide SVG is inlined at build time and ships no client JS.
 */
export function IconBadge({ icon: Icon, className }: IconBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary',
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}
