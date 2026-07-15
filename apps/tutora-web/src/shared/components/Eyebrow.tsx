import { cn } from '@shared/utils';

type EyebrowProps = {
  children: string;
  className?: string;
};

/** Small tinted label that sits above a section heading. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase',
        className,
      )}
    >
      {children}
    </span>
  );
}
