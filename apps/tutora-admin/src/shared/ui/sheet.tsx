import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

/** Slide-over panel (built on Radix Dialog). Used for the mobile navigation drawer. */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  side = 'left',
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { side?: 'left' | 'right' }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-50 flex h-full w-72 max-w-[85%] flex-col bg-sidebar text-sidebar-foreground shadow-lg',
          'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
          side === 'left'
            ? 'left-0 border-r border-sidebar-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left'
            : 'right-0 border-l border-sidebar-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-sm font-semibold', className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-sidebar-muted', className)}
      {...props}
    />
  );
}
