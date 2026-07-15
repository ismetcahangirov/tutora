import { BadgeCheck, MapPin, Star } from 'lucide-react';

/**
 * Decorative hero preview — a stylised tutor result card with a floating rating
 * chip. Purely presentational (hidden from assistive tech); built with CSS only,
 * so there is nothing to download and no layout shift.
 */
export function HeroVisual() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md">
      <div className="rounded-xl border border-border bg-card p-6 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-4">
          <span className="size-14 shrink-0 rounded-full bg-primary-tint" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-28 rounded-full bg-foreground/85" />
              <BadgeCheck className="size-4 text-primary" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <MapPin className="size-3.5" /> <span className="h-2.5 w-20 rounded-full bg-border" />
            </span>
          </div>
          <span className="rounded-md bg-primary-tint px-2 py-1 text-xs font-semibold text-primary">
            ₼15/hr
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="h-6 w-20 rounded-full bg-muted" />
          <span className="h-6 w-16 rounded-full bg-muted" />
          <span className="h-6 w-24 rounded-full bg-muted" />
        </div>

        <div className="mt-5 space-y-2">
          <span className="block h-2.5 w-full rounded-full bg-muted" />
          <span className="block h-2.5 w-4/5 rounded-full bg-muted" />
        </div>

        <div className="mt-5 flex items-center gap-1 text-accent">
          <Star className="size-4 fill-current" />
          <Star className="size-4 fill-current" />
          <Star className="size-4 fill-current" />
          <Star className="size-4 fill-current" />
          <Star className="size-4 fill-current" />
          <span className="ml-1 text-xs font-semibold text-muted-foreground">4.9</span>
        </div>
      </div>

      <div className="absolute -top-4 -right-3 rounded-lg border border-border bg-card px-3 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <span className="flex items-center gap-2 text-xs font-semibold text-success">
          <BadgeCheck className="size-4" /> Verified
        </span>
      </div>
    </div>
  );
}
