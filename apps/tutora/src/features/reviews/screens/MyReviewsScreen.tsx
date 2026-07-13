/**
 * MyReviewsScreen — the caller's own reviews with edit + delete (#48).
 *
 * Lists the student's reviews (loading / empty / error / populated all handled),
 * routes edits up to the composer, and deletes behind a confirmation modal so a
 * tap can't wipe a review by accident. A successful delete refreshes the list via
 * the mutation's cache invalidation.
 */
import { useState } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  Text,
  useToast,
} from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { MyReviewCard } from '../components/MyReviewCard';
import { useDeleteReview } from '../hooks/useDeleteReview';
import { useMyReviews } from '../hooks/useMyReviews';
import type { MyReview } from '../types';

export type MyReviewsScreenProps = {
  onBack: () => void;
  onEditReview: (review: MyReview) => void;
};

export function MyReviewsScreen({ onBack, onEditReview }: MyReviewsScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { reviews, isLoading, isError, isRefetching, refetch } = useMyReviews();
  const { remove, isDeleting } = useDeleteReview();
  const [pendingDelete, setPendingDelete] = useState<MyReview | null>(null);

  const closeConfirm = () => {
    if (!isDeleting) {
      setPendingDelete(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    try {
      await remove(pendingDelete.id);
      toast.show({ message: t('reviews.myReviews.deleteSuccess'), type: 'success' });
      setPendingDelete(null);
    } catch {
      toast.show({ message: t('reviews.myReviews.deleteError'), type: 'error' });
    }
  };

  const renderItem: ListRenderItem<MyReview> = ({ item }) => (
    <MyReviewCard
      review={item}
      onEdit={() => onEditReview(item)}
      onDelete={() => setPendingDelete(item)}
    />
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <Button
          label={t('common.back')}
          accessibilityLabel={t('common.back')}
          variant="ghost"
          size="compact"
          leadingIcon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
        />
        <Text variant="subtitle" numberOfLines={1} style={styles.headerTitle}>
          {t('reviews.myReviews.title')}
        </Text>
      </View>

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError ? (
        <ErrorState
          title={t('reviews.myReviews.error')}
          retryLabel={t('common.retry')}
          onRetry={() => refetch()}
        />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={ItemSeparator}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <EmptyState
              icon="star"
              title={t('reviews.myReviews.empty')}
              description={t('reviews.myReviews.emptyHint')}
            />
          }
          testID="my-reviews-list"
        />
      )}

      <Modal
        visible={pendingDelete !== null}
        onClose={closeConfirm}
        title={t('reviews.myReviews.deleteTitle')}
      >
        <Text variant="body" color="textSecondary">
          {t('reviews.myReviews.deleteMessage')}
        </Text>
        <View style={styles.confirmActions}>
          <Button
            label={t('common.cancel')}
            variant="outline"
            onPress={closeConfirm}
            disabled={isDeleting}
            style={styles.confirmButton}
          />
          <Button
            label={t('reviews.myReviews.deleteConfirm')}
            variant="danger"
            onPress={confirmDelete}
            loading={isDeleting}
            style={styles.confirmButton}
          />
        </View>
      </Modal>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    alignSelf: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmButton: {
    flex: 1,
  },
});
