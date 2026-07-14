import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Brand } from '@shared/components';
import { APP_NAME } from '@shared/constants';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@shared/ui';

import { SidebarNav } from './SidebarNav';

/** Hamburger-triggered navigation drawer for viewports below `lg`. */
export function MobileNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('nav.openMenu')}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Brand />
        </div>
        {/* Visually hidden a11y labels required by the underlying dialog. */}
        <SheetTitle className="sr-only">{APP_NAME}</SheetTitle>
        <SheetDescription className="sr-only">{t('nav.primary')}</SheetDescription>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
