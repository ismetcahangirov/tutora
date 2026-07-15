import { Apple, Play } from 'lucide-react';

import { env } from '@shared/config/env';
import { cn } from '@shared/utils';

type StoreBadgesProps = {
  iosLabel: string;
  androidLabel: string;
  className?: string;
};

/** App Store + Google Play buttons. Solid dark fill, no gradients. Links point at
 *  the configured store URLs (a no-op `#` until the apps are published). */
export function StoreBadges({ iosLabel, androidLabel, className }: StoreBadgesProps) {
  const badges = [
    { href: env.NEXT_PUBLIC_IOS_URL, label: iosLabel, icon: Apple },
    { href: env.NEXT_PUBLIC_ANDROID_URL, label: androidLabel, icon: Play },
  ];

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      {badges.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          className="inline-flex h-13 items-center gap-3 rounded-md bg-foreground px-5 text-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <Icon className="size-6 shrink-0" aria-hidden />
          <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
        </a>
      ))}
    </div>
  );
}
