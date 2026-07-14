import { Check, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';

import { useReviewCertificate } from '../hooks/useVerificationMutations';
import type { Certificate } from '../types';
import { CertificateStatusBadge } from './CertificateStatusBadge';
import { RejectionReasonNote } from './RejectionReasonNote';
import { RejectReasonDialog } from './RejectReasonDialog';

/**
 * Certificates with an inline approve/reject control each (issue #63). Approval
 * applies directly; rejection opens a dialog that requires a reason, which is
 * shown back to the tutor. Per-row pending/error state is derived from the
 * shared mutation's in-flight variables.
 */
export function CertificateReviewList({
  tutorId,
  certificates,
  locale,
}: {
  tutorId: string;
  certificates: Certificate[];
  locale: string;
}) {
  const { t } = useTranslation();
  const review = useReviewCertificate();
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const isPendingFor = (certificateId: string) =>
    review.isPending && review.variables?.certificateId === certificateId;

  const approve = (certificateId: string) =>
    review.mutate({ tutorId, certificateId, body: { status: 'VERIFIED' } });

  const confirmReject = (reason: string) => {
    if (!rejectingId) return;
    review.mutate(
      { tutorId, certificateId: rejectingId, body: { status: 'REJECTED', reason } },
      { onSuccess: () => setRejectingId(null) },
    );
  };

  if (certificates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('verifications.detail.noCertificates')}</p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {certificates.map((cert) => (
          <li key={cert.id} className="rounded-md border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{cert.title}</p>
                {cert.issuedBy ? (
                  <p className="truncate text-xs text-muted-foreground">{cert.issuedBy}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(cert.createdAt, locale)}
                </p>
              </div>
              <CertificateStatusBadge status={cert.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="ghost">
                <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  {t('verifications.detail.viewFile')}
                </a>
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => approve(cert.id)}
                  disabled={isPendingFor(cert.id) || cert.status === 'VERIFIED'}
                >
                  <Check />
                  {t('verifications.detail.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectingId(cert.id)}
                  disabled={isPendingFor(cert.id) || cert.status === 'REJECTED'}
                >
                  <X />
                  {t('verifications.detail.reject')}
                </Button>
              </div>
            </div>

            {cert.status === 'REJECTED' && cert.reviewReason ? (
              <div className="mt-3">
                <RejectionReasonNote reason={cert.reviewReason} />
              </div>
            ) : null}

            {review.isError && review.variables?.certificateId === cert.id ? (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {t('verifications.error')}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {rejectingId ? (
        <RejectReasonDialog
          open
          onOpenChange={(open) => !open && setRejectingId(null)}
          title={t('verifications.confirm.rejectCertTitle')}
          description={t('verifications.confirm.rejectCertDescription')}
          placeholder={t('verifications.reject.certReasonPlaceholder')}
          confirmLabel={t('verifications.detail.reject')}
          onConfirm={confirmReject}
          pending={review.isPending}
          error={review.isError ? t('verifications.error') : null}
        />
      ) : null}
    </>
  );
}
