/**
 * TutorApplicationsScreen — the tutor's incoming-applications inbox (tutor epic
 * #51, #57).
 *
 * A status-filtered list of applications with inline accept / decline / complete.
 * Every data state is handled — loading, error with retry, empty (per filter),
 * populated — plus pull-to-refresh. Actions toast on both outcomes and, because a
 * response changes an application's status, the list reconciles via the mutation's
 * cache invalidation. This is a tab screen, so it owns no back navigation.
 */
import { useState } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState, Text, useToast } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { ApplicationCard } from '../components/ApplicationCard';
import { ApplicationFilterBar } from '../components/ApplicationFilterBar';
import { useApplicationActions } from '../hooks/useApplicationActions';
import { useTutorApplications } from '../hooks/useTutorApplications';
import type { ApplicationAction, ApplicationStatus, TutorApplication } from '../types';

export function TutorApplicationsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const [filter, setFilter] = useState<ApplicationStatus | undefined>(undefined);

  const { applications, isLoading, isError, isRefetching, refetch } = useTutorApplications(filter);
  const { respond, pendingId } = useApplicationActions();

  const handleRespond = async (action: ApplicationAction, id: string) => {
    try {
      await respond(action, id);
      toast.show({ message: t(`tutor.applications.actions.${action}Success`), type: 'success' });
    } catch {
      toast.show({ message: t('tutor.applications.actionError'), type: 'error' });
    }
  };

  const renderItem: ListRenderItem<TutorApplication> = ({ item }) => (
    <ApplicationCard
      application={item}
      isPending={pendingId === item.id}
      onRespond={(action, id) => void handleRespond(action, id)}
    />
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.titleBar}>
        <Text variant="headline">{t('tutor.applications.title')}</Text>
      </View>

      <ApplicationFilterBar value={filter} onChange={setFilter} />

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError ? (
        <ErrorState
          title={t('tutor.applications.error')}
          retryLabel={t('common.retry')}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={ItemSeparator}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <EmptyState
              icon="inbox"
              title={t('tutor.applications.empty')}
              description={t('tutor.applications.emptyHint')}
            />
          }
          testID="tutor-applications-list"
        />
      )}
    </SafeAreaView>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
});
