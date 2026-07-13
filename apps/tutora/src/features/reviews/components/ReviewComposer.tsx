/**
 * ReviewComposer — the rating + comment form for authoring/editing a review (#48).
 *
 * Controlled locally: a rating (required, 1–5) and an optional comment bounded to
 * the backend limit. Submit is disabled until a rating is chosen and while a
 * request is in flight; the comment is trimmed before it leaves. Reused for both
 * "create" and "edit" — the caller supplies the initial values and submit label.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Input, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { MIN_RATING, REVIEW_COMMENT_MAX_LENGTH } from '../constants';
import { RatingInput } from './RatingInput';

export type ReviewComposerProps = {
  initialRating?: number;
  initialComment?: string;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (rating: number, comment: string) => void;
};

export function ReviewComposer({
  initialRating = 0,
  initialComment = '',
  submitLabel,
  isSubmitting,
  onSubmit,
}: ReviewComposerProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);

  const canSubmit = rating >= MIN_RATING && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    onSubmit(rating, comment.trim());
  };

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text variant="label">{t('reviews.compose.ratingLabel')}</Text>
        <RatingInput value={rating} onChange={setRating} disabled={isSubmitting} />
        <Text variant="caption" color="muted">
          {t('reviews.compose.ratingHint')}
        </Text>
      </View>

      <Input
        label={t('reviews.compose.commentLabel')}
        placeholder={t('reviews.compose.commentPlaceholder')}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        disabled={isSubmitting}
        helperText={t('reviews.compose.commentHelper', {
          count: comment.length,
          max: REVIEW_COMMENT_MAX_LENGTH,
        })}
      />

      <Button
        label={submitLabel}
        onPress={handleSubmit}
        disabled={!canSubmit}
        loading={isSubmitting}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing['2xl'],
  },
  field: {
    gap: spacing.sm,
  },
});
