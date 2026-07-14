import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  Separator,
  Textarea,
} from '@shared/ui';
import { formatDateTime } from '@shared/utils/formatDate';
import { getInitials } from '@shared/utils/initials';

import { useModerateReview } from '../hooks/useReviewMutations';
import {
  HIDDEN_REASON_MAX_LENGTH,
  REVIEW_STATUSES,
  type AdminReview,
  type ModerateReviewBody,
  type ReviewStatus,
} from '../types';
import { ReviewStatusBadge } from './ReviewStatusBadge';
import { StarRating } from './StarRating';

/**
 * Review moderation (issue #64): inspect a review and set its visibility. A
 * reason is required when hiding or removing (it documents why for the author
 * and the audit trail) and is cleared automatically on re-publish. State is
 * seeded from the review and the dialog is remounted per review (via `key`), so
 * no effect is needed to sync props.
 */
export function ReviewModerationDialog({
  review,
  onOpenChange,
}: {
  review: AdminReview;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const moderate = useModerateReview();

  const [status, setStatus] = useState<ReviewStatus>(review.status);
  const [hiddenReason, setHiddenReason] = useState(review.hiddenReason ?? '');
  const [missingReason, setMissingReason] = useState(false);

  const requiresReason = status !== 'PUBLISHED';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedReason = hiddenReason.trim();
    if (requiresReason && !trimmedReason) {
      setMissingReason(true);
      return;
    }
    setMissingReason(false);

    const body: ModerateReviewBody = { status };
    if (requiresReason) body.hiddenReason = trimmedReason;
    moderate.mutate({ id: review.id, body }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{t('reviews.moderate.title')}</DialogTitle>
          <DialogDescription>{t('reviews.moderate.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-5">
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {review.author.avatarUrl ? (
                      <AvatarImage src={review.author.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(review.author.name, review.author.id)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {review.author.name ?? review.author.id}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t('reviews.moderate.forTutor', { tutor: review.tutorName ?? '—' })}
                    </p>
                  </div>
                </div>
                <StarRating
                  value={review.rating}
                  label={t('reviews.ratingLabel', { rating: review.rating })}
                />
              </div>
              <p className="text-sm text-foreground">
                {review.comment ?? t('reviews.moderate.noComment')}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <ReviewStatusBadge status={review.status} />
                <span>{formatDateTime(review.createdAt, i18n.language)}</span>
                {review.moderatedAt ? (
                  <span>
                    {t('reviews.moderate.lastModerated', {
                      date: formatDateTime(review.moderatedAt, i18n.language),
                    })}
                  </span>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="moderate-review-status">{t('reviews.moderate.decision')}</Label>
              <Select
                id="moderate-review-status"
                value={status}
                onChange={(event) => {
                  const next = REVIEW_STATUSES.find((s) => s === event.target.value);
                  if (next) setStatus(next);
                }}
              >
                {REVIEW_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`reviews.status.${s}`)}
                  </option>
                ))}
              </Select>
            </div>

            {requiresReason ? (
              <div className="space-y-1.5">
                <Label htmlFor="moderate-review-reason">{t('reviews.moderate.reason')}</Label>
                <Textarea
                  id="moderate-review-reason"
                  value={hiddenReason}
                  onChange={(event) => setHiddenReason(event.target.value)}
                  maxLength={HIDDEN_REASON_MAX_LENGTH}
                  placeholder={t('reviews.moderate.reasonPlaceholder')}
                />
                {missingReason ? (
                  <p role="alert" className="text-sm text-destructive">
                    {t('reviews.moderate.reasonRequired')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {moderate.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('reviews.moderate.error')}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" disabled={moderate.isPending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              variant={requiresReason ? 'destructive' : 'primary'}
              disabled={moderate.isPending}
            >
              {t('reviews.moderate.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
