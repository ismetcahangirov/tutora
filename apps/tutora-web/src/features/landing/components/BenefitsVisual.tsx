import { BadgeCheck, Eye, Send, Star, TrendingUp } from 'lucide-react';

type BenefitsVisualProps = {
  variant: 'tutor' | 'student';
};

/**
 * Decorative preview beside each benefits block: a tutor-facing stats panel or a
 * student-facing comparison panel. Presentational only (hidden from assistive
 * tech) and CSS-based, so nothing is fetched.
 */
export function BenefitsVisual({ variant }: BenefitsVisualProps) {
  return (
    <div aria-hidden className="mx-auto w-full max-w-md">
      {variant === 'tutor' ? <TutorPanel /> : <StudentPanel />}
    </div>
  );
}

function TutorPanel() {
  const tiles = [
    { icon: Eye, value: '1.2k' },
    { icon: Send, value: '48' },
    { icon: Star, value: '4.9' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary-tint text-primary">
          <TrendingUp className="size-5" />
        </span>
        <span className="h-3 w-32 rounded-full bg-foreground/80" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {tiles.map(({ icon: Icon, value }) => (
          <div key={value} className="rounded-lg bg-surface p-3 text-center">
            <Icon className="mx-auto size-4 text-muted-foreground" />
            <span className="mt-2 block text-lg font-bold text-foreground tabular-nums">
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex h-24 items-end gap-2">
        {[40, 65, 50, 80, 72, 95].map((height, index) => (
          <span
            key={index}
            className="flex-1 rounded-t bg-primary/80"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function StudentPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
      {[0, 1].map((row) => (
        <div
          key={row}
          className="flex items-center gap-3 border-border py-4 first:pt-0 last:pb-0 [&:not(:last-child)]:border-b"
        >
          <span className="size-11 shrink-0 rounded-full bg-primary-tint" />
          <div className="flex-1 space-y-2">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-24 rounded-full bg-foreground/80" />
              <BadgeCheck className="size-4 text-primary" />
            </span>
            <span className="flex items-center gap-1 text-accent">
              <Star className="size-3.5 fill-current" />
              <span className="h-2 w-12 rounded-full bg-border" />
            </span>
          </div>
          <span className="rounded-md bg-primary-tint px-2 py-1 text-xs font-semibold text-primary">
            ₼{row === 0 ? '15' : '20'}
          </span>
        </div>
      ))}
    </div>
  );
}
