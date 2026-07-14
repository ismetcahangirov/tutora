import { useQuery } from '@tanstack/react-query';

import { getDashboardStats } from '../api/dashboard.api';
import { dashboardKeys } from '../constants';

/** Dashboard analytics query. Figures are live, so the default cache applies. */
export function useDashboardQuery() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: getDashboardStats,
  });
}
