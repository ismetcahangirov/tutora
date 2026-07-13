/**
 * ReviewComposerScreen — author or edit a review (#48).
 *
 * Reused for both flows: "create" reviews a completed application (the tutor is
 * derived server-side from it); "edit" revises one of the caller's own reviews.
 * The four outcomes are handled — a disabled submit until valid, an in-flight
 * spinner, a success toast + navigation back, and an error toast that leaves the
 * draft intact so nothing is lost.
 */
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text, useToast } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { ReviewComposer } from '../components/ReviewComposer';
import { useSubmitReview } from '../hooks/useSubmitReview';
import { useUpdateReview } from '../hooks/useUpdateReview';

export type ReviewComposerMode = 'create' | 'edit';

export type ReviewComposerScreenProps = {
  mode: ReviewComposerMode;
  /** create: the completed application being reviewed (tutor derived from it). */
  applicationId?: string;
  /** edit: the review being revised and its current values. */
  reviewId?: string;
  initialRating?: number;
  initialComment?: string;
  /** Tutor being reviewed — shown as a subtitle on the create flow. */
  tutorName?: string | null;
  onDone: () => void;
};

export function ReviewComposerScreen({
  mode,
  applicationId,
  reviewId,
  initialRating,
  initialComment,
  tutorName,
  onDone,
}: ReviewComposerScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { submit, isSubmitting } = useSubmitReview();
  const { update, isUpdating } = useUpdateReview();

  const isCreate = mode === 'create';
  const title = isCreate ? t('reviews.compose.createTitle') : t('reviews.compose.editTitle');

  const handleSubmit = async (rating: number, comment: string) => {
    try {
      if (isCreate) {
        if (!applicationId) {
          toast.show({ message: t('reviews.compose.missingApplication'), type: 'error' });
          return;
        }
        await submit({ applicationId, rating, comment: comment || undefined });
        toast.show({ message: t('reviews.compose.successCreate'), type: 'success' });
      } else {
        if (!reviewId) {
          toast.show({ message: t('reviews.compose.error'), type: 'error' });
          return;
        }
        await update(reviewId, { rating, comment });
        toast.show({ message: t('reviews.compose.successUpdate'), type: 'success' });
      }
      onDone();
    } catch {
      toast.show({ message: t('reviews.compose.error'), type: 'error' });
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <Button
          label={t('common.back')}
          accessibilityLabel={t('common.back')}
          variant="ghost"
          size="compact"
          leadingIcon="arrow-left"
          onPress={onDone}
          style={styles.backButton}
        />
        <View style={styles.headerText}>
          <Text variant="subtitle" numberOfLines={1}>
            {title}
          </Text>
          {isCreate && tutorName ? (
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {tutorName}
            </Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing['2xl'] : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ReviewComposer
            initialRating={initialRating}
            initialComment={initialComment}
            submitLabel={isCreate ? t('reviews.compose.submit') : t('reviews.compose.saveChanges')}
            isSubmitting={isSubmitting || isUpdating}
            onSubmit={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
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
  headerText: {
    flex: 1,
    gap: 2,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
});
