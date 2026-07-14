import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listAuditLogs } from '../api/audit-logs.api';
import { auditLogsKeys } from '../constants';
import type { ListAuditLogsParams } from '../types';

/**
 * Paginated audit-log query. `keepPreviousData` keeps the current page visible
 * while the next page or a changed filter loads, avoiding a table flash.
 */
export function useAuditLogsQuery(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: auditLogsKeys.list(params),
    queryFn: () => listAuditLogs(params),
    placeholderData: keepPreviousData,
  });
}
