import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog, ErrorView } from '@shared/components';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
  Skeleton,
} from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';
import { getInitials } from '@shared/utils/initials';

import { useTutorQuery } from '../hooks/useTutors';
import { useSetVerification } from '../hooks/useVerificationMutations';
import type { AdminTutor } from '../types';
import { CertificateReviewList } from './CertificateReviewList';
import { RejectionReasonNote } from './RejectionReasonNote';
import { RejectReasonDialog } from './RejectReasonDialog';
import { VerificationStatusBadge } from './VerificationStatusBadge';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {items.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

function TutorSummary({ tutor, locale }: { tutor: AdminTutor; locale: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          {tutor.avatarUrl ? <AvatarImage src={tutor.avatarUrl} alt="" /> : null}
          <AvatarFallback>{getInitials(tutor.name, tutor.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-foreground">{tutor.name ?? '—'}</p>
            <VerificationStatusBadge status={tutor.verificationStatus} />
          </div>
          <p className="truncate text-sm text-muted-foreground">{tutor.email}</p>
        </div>
      </div>

      {tutor.bio ? <p className="text-sm text-muted-foreground">{tutor.bio}</p> : null}

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Fact label={t('verifications.detail.experience')} value={String(tutor.experienceYears)} />
        <Fact
          label={t('verifications.detail.rate')}
          value={tutor.hourlyRate === null ? '—' : `${tutor.hourlyRate} ${tutor.currency}`}
        />
        <Fact
          label={t('verifications.detail.rating')}
          value={
            tutor.ratingCount > 0 ? `${tutor.ratingAvg.toFixed(1)} (${tutor.ratingCount})` : '—'
          }
        />
        <Fact
          label={t('verifications.detail.published')}
          value={t(tutor.isPublished ? 'common.yes' : 'common.no')}
        />
        <Fact
          label={t('verifications.detail.joined')}
          value={formatDate(tutor.createdAt, locale)}
        />
      </dl>

      <ChipRow
        label={t('verifications.detail.subjects')}
        items={tutor.subjects.map((s) => s.name)}
      />
      <ChipRow
        label={t('verifications.detail.languages')}
        items={tutor.languages.map((l) => l.name)}
      />
      <ChipRow
        label={t('verifications.detail.districts')}
        items={tutor.districts.map((d) => d.name)}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/**
 * Tutor verification review (issue #63): identity verify/reject (gated by a
 * confirmation) and per-certificate approve/reject. Fetches the full profile on
 * open; the row only carries the tutor id.
 */
export function TutorVerificationDialog({
  tutorId,
  onOpenChange,
}: {
  tutorId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const { data: tutor, isLoading, isError, refetch } = useTutorQuery(tutorId);
  const setVerification = useSetVerification();
  const [action, setAction] = useState<'verify' | 'reject' | null>(null);

  const closeAction = () => setAction(null);

  const confirmVerify = () => {
    setVerification.mutate(
      { id: tutorId, body: { status: 'VERIFIED' } },
      { onSuccess: closeAction },
    );
  };

  const confirmReject = (reason: string) => {
    setVerification.mutate(
      { id: tutorId, body: { status: 'REJECTED', reason } },
      { onSuccess: closeAction },
    );
  };

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader closeLabel={t('common.close')}>
            <DialogTitle>{t('verifications.detail.title')}</DialogTitle>
            <DialogDescription>
              {tutor ? (tutor.name ?? tutor.email) : t('common.loading')}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            {isError ? (
              <ErrorView onRetry={() => void refetch()} />
            ) : isLoading || !tutor ? (
              <DetailSkeleton />
            ) : (
              <>
                <TutorSummary tutor={tutor} locale={i18n.language} />
                <Separator />
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('verifications.detail.identity')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => setAction('verify')}
                      disabled={
                        setVerification.isPending || tutor.verificationStatus === 'VERIFIED'
                      }
                    >
                      <Check />
                      {t('verifications.detail.approveIdentity')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setAction('reject')}
                      disabled={
                        setVerification.isPending || tutor.verificationStatus === 'REJECTED'
                      }
                    >
                      <X />
                      {t('verifications.detail.rejectIdentity')}
                    </Button>
                  </div>
                  {tutor.verificationStatus === 'REJECTED' && tutor.verificationReason ? (
                    <RejectionReasonNote reason={tutor.verificationReason} />
                  ) : null}
                </section>
                <Separator />
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('verifications.detail.certificates')}
                  </h3>
                  <CertificateReviewList
                    tutorId={tutor.id}
                    certificates={tutor.certificates}
                    locale={i18n.language}
                  />
                </section>
              </>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">
                {t('common.close')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {action === 'verify' ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && closeAction()}
          title={t('verifications.confirm.verifyTitle')}
          description={t('verifications.confirm.verifyDescription')}
          confirmLabel={t('verifications.detail.approveIdentity')}
          onConfirm={confirmVerify}
          pending={setVerification.isPending}
          error={setVerification.isError ? t('verifications.error') : null}
        />
      ) : null}

      {action === 'reject' ? (
        <RejectReasonDialog
          open
          onOpenChange={(open) => !open && closeAction()}
          title={t('verifications.confirm.rejectTitle')}
          description={t('verifications.confirm.rejectDescription')}
          placeholder={t('verifications.reject.reasonPlaceholder')}
          confirmLabel={t('verifications.detail.rejectIdentity')}
          onConfirm={confirmReject}
          pending={setVerification.isPending}
          error={setVerification.isError ? t('verifications.error') : null}
        />
      ) : null}
    </>
  );
}
