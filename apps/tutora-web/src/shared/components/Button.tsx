import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { cn } from '@shared/utils';

type ButtonVariant = 'primary' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'>;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-dark',
  outline: 'border border-primary text-primary hover:bg-primary-tint',
  ghost: 'text-primary hover:bg-primary-tint',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

/**
 * Link-styled call to action. Every CTA on the landing is a navigation target
 * (an on-page anchor or an external store link), so this renders an `<a>` rather
 * than a `<button>`. Meets the 44px minimum tap target at every size.
 */
export function Button({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
