import type { ElementType, ReactNode } from 'react';

import { cn } from '@shared/utils';

import { Container } from './Container';

type SectionProps = {
  /** Anchor target used by the header nav and skip link. */
  id?: string;
  children: ReactNode;
  /** Tints the section with the muted surface token to alternate the rhythm. */
  surface?: boolean;
  /** Landmark element — defaults to a plain `section`. */
  as?: ElementType;
  className?: string;
  /** Accessible label for the region when it has no visible heading. */
  ariaLabel?: string;
  ariaLabelledby?: string;
};

/**
 * Vertical page section with consistent block spacing, an anchor id, and an
 * optional muted surface. Wraps content in the shared {@link Container}.
 */
export function Section({
  id,
  children,
  surface = false,
  as: Tag = 'section',
  className,
  ariaLabel,
  ariaLabelledby,
}: SectionProps) {
  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={cn('py-20 sm:py-24', surface && 'bg-surface', className)}
    >
      <Container>{children}</Container>
    </Tag>
  );
}
