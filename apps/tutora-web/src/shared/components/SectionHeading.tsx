import { cn } from '@shared/utils';

import { Eyebrow } from './Eyebrow';

type SectionHeadingProps = {
  /** Optional id so a parent Section can wire `aria-labelledby` to the title. */
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
};

/** Eyebrow + H2 + supporting copy, used to open most page sections. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        centered ? 'mx-auto max-w-2xl items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        id={id}
        className="text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{description}</p>
      ) : null}
    </div>
  );
}
