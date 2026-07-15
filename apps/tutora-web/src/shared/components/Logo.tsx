import { GraduationCap } from 'lucide-react';

import { APP_NAME } from '@shared/constants';
import { cn } from '@shared/utils';

type LogoProps = {
  className?: string;
  /** Hide the wordmark, leaving just the mark (e.g. tight footers). */
  markOnly?: boolean;
};

/** Tutora wordmark: solid indigo mark + brand name. No gradients. */
export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold text-foreground', className)}>
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <GraduationCap className="size-5" aria-hidden />
      </span>
      {markOnly ? null : <span className="text-lg tracking-tight">{APP_NAME}</span>}
    </span>
  );
}
