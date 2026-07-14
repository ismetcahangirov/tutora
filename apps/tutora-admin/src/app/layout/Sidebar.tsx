import { Brand } from '@shared/components';

import { SidebarNav } from './SidebarNav';

/** Persistent desktop sidebar (≥ lg). The mobile drawer reuses `SidebarNav`. */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Brand />
      </div>
      <SidebarNav />
    </aside>
  );
}
