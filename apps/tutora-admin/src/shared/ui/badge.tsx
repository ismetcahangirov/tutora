import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

import { badgeVariants, type BadgeVariants } from './badge-variants';

export type BadgeProps = ComponentProps<'span'> & BadgeVariants;

/** Small status/label chip. Colour comes from the `variant`, never inline styles. */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
