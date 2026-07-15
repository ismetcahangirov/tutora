/**
 * The admin panel's information architecture (issue #59). One entry per
 * top-level section: the sidebar renders these, and the router builds a route
 * per entry. Each section declares the permission that gates it, so navigation
 * and routing stay in lockstep and RBAC has a single source of truth.
 */
import {
  BadgeCheck,
  Bell,
  CreditCard,
  FileText,
  Languages,
  LayoutDashboard,
  type LucideIcon,
  MessageSquareWarning,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react';

import type { Permission } from '@shared/rbac';

export type NavItem = {
  /** Stable id — also the epic sub-issue's section. */
  id: string;
  /** Absolute route path. */
  path: string;
  /** i18n key for the label. */
  labelKey: string;
  icon: LucideIcon;
  /** Permission required to see the item and enter the route. */
  permission: Permission;
  /** Match the path exactly (used for the index/dashboard route). */
  end?: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'dashboard',
    path: '/',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:view',
    end: true,
  },
  { id: 'users', path: '/users', labelKey: 'nav.users', icon: Users, permission: 'users:manage' },
  {
    id: 'verifications',
    path: '/verifications',
    labelKey: 'nav.verifications',
    icon: BadgeCheck,
    permission: 'verifications:review',
  },
  {
    id: 'reviews',
    path: '/reviews',
    labelKey: 'nav.reviews',
    icon: MessageSquareWarning,
    permission: 'reviews:moderate',
  },
  {
    id: 'taxonomy',
    path: '/taxonomy',
    labelKey: 'nav.taxonomy',
    icon: Tags,
    permission: 'taxonomy:manage',
  },
  {
    id: 'notifications',
    path: '/notifications',
    labelKey: 'nav.notifications',
    icon: Bell,
    permission: 'notifications:send',
  },
  { id: 'cms', path: '/cms', labelKey: 'nav.cms', icon: FileText, permission: 'cms:manage' },
  {
    id: 'translations',
    path: '/translations',
    labelKey: 'nav.translations',
    icon: Languages,
    permission: 'cms:manage',
  },
  {
    id: 'payments',
    path: '/payments',
    labelKey: 'nav.payments',
    icon: CreditCard,
    permission: 'payments:manage',
  },
  {
    id: 'roles',
    path: '/roles',
    labelKey: 'nav.roles',
    icon: ShieldCheck,
    permission: 'roles:manage',
  },
  {
    id: 'settings',
    path: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    permission: 'settings:manage',
  },
  { id: 'logs', path: '/logs', labelKey: 'nav.logs', icon: ScrollText, permission: 'logs:view' },
] as const;

/** The nav items the current principal may see, given a permission check. */
export function visibleNavItems(
  items: readonly NavItem[],
  can: (permission: Permission) => boolean,
): NavItem[] {
  return items.filter((item) => can(item.permission));
}
