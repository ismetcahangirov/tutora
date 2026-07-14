import { LanguageSwitcher } from '@shared/i18n';
import { ThemeToggle } from '@shared/theme';

import { MobileNav } from './MobileNav';
import { UserMenu } from './UserMenu';

/** Sticky top bar: mobile menu trigger on the left, account controls on the right. */
export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-1 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <MobileNav />
      <div className="flex-1" />
      <LanguageSwitcher />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
