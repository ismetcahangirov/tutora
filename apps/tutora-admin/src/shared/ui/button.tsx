import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

import { buttonVariants, type ButtonVariants } from './button-variants';

export type ButtonProps = ComponentProps<'button'> &
  ButtonVariants & {
    /** Render as the child element (e.g. a router `Link`) while keeping styles. */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  // Only a real <button> gets a default type; forwarding `type` to an anchor
  // via Slot would be invalid.
  const typeProp = asChild ? {} : { type: type ?? 'button' };
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...typeProp} {...props} />
  );
}
