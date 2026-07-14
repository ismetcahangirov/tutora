import { useTranslation } from 'react-i18next';

/**
 * Read-only display of a stored rejection reason (issue #63), shown for an
 * already-rejected tutor identity or certificate so an admin can see why.
 */
export function RejectionReasonNote({ reason }: { reason: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-border bg-muted/40 p-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('verifications.detail.rejectionReason')}
      </p>
      <p className="mt-0.5 whitespace-pre-line text-sm text-foreground">{reason}</p>
    </div>
  );
}
