import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { usePermissions } from '@features/auth';
import { cn } from '@shared/lib/cn';

import { NAV_ITEMS, visibleNavItems } from '../navigation/nav-config';

/**
 * Permission-aware primary navigation. Only the sections the signed-in admin may
 * access are rendered. `onNavigate` lets the mobile drawer close on selection.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const items = visibleNavItems(NAV_ITEMS, can);

  return (
    <nav
      aria-label={t('nav.primary')}
      className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
