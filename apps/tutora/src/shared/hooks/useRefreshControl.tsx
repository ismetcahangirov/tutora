/**
 * useRefreshControl — a themed pull-to-refresh control bound to a query's
 * `refetch` (#171/#175). Spread the result into a `ScrollView`/`FlatList`'s
 * `refreshControl` prop; every screen gets the same tint without repeating it.
 */
import { useMemo } from 'react';
import { RefreshControl } from 'react-native';

import { useColors } from '@/theme';

export function useRefreshControl(refreshing: boolean, onRefresh: () => void) {
  const colors = useColors();

  return useMemo(
    () => (
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
    ),
    [refreshing, onRefresh, colors.primary],
  );
}
