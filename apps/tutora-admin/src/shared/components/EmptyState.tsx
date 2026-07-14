import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { StatusView } from './StatusView';

/** Empty-collection placeholder. Sections drop this in until they have data. */
export function EmptyState({
  title,
  description,
  icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return <StatusView icon={icon} title={title} description={description} action={action} />;
}
