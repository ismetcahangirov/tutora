import { Check, ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';

import { useReviewCertificate } from '../hooks/useVerificationMutations';
import type { Certificate, CertificateDecision } from '../types';
import { CertificateStatusBadge } from './CertificateStatusBadge';

/**
 * Certificates with an inline approve/reject control each (issue #63). Decisions
 * are reversible, so they apply directly; the per-row pending/error state is
 * derived from the shared mutation's in-flight variables.
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

  const isPendingFor = (certificateId: string) =>
    review.isPending && review.variables?.certificateId === certificateId;

  const decide = (certificateId: string, status: CertificateDecision) =>
    review.mutate({ tutorId, certificateId, status });

  if (certificates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('verifications.detail.noCertificates')}</p>
    );
  }

  return (
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
                onClick={() => decide(cert.id, 'VERIFIED')}
                disabled={isPendingFor(cert.id) || cert.status === 'VERIFIED'}
              >
                <Check />
                {t('verifications.detail.approve')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => decide(cert.id, 'REJECTED')}
                disabled={isPendingFor(cert.id) || cert.status === 'REJECTED'}
              >
                <X />
                {t('verifications.detail.reject')}
              </Button>
            </div>
          </div>

          {review.isError && review.variables?.certificateId === cert.id ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {t('verifications.error')}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
