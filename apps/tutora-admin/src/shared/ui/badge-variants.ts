import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Status/label chips built on design tokens (no gradients). Kept in its own
 * module so `badge.tsx` only exports a component (React Fast Refresh).
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'border-transparent bg-muted text-muted-foreground',
        primary: 'border-transparent bg-accent text-accent-foreground',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/15 text-warning',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
