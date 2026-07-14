import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
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
  Textarea,
} from '@shared/ui';

import { REJECTION_REASON_MAX_LENGTH } from '../types';

/**
 * Reject-with-reason modal shared by identity and certificate rejection (issue
 * #63). A reason is required — it documents the decision for the audit trail and
 * is shown to the tutor so they can fix and re-apply. Mount it only while a
 * rejection is in flight so its local state resets on each open.
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  confirmLabel,
  onConfirm,
  pending = false,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  pending?: boolean;
  error?: string | null;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [missing, setMissing] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setMissing(true);
      return;
    }
    setMissing(false);
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-1.5">
            <Label htmlFor="reject-reason">{t('verifications.reject.reason')}</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={REJECTION_REASON_MAX_LENGTH}
              placeholder={placeholder}
              autoFocus
            />
            {missing ? (
              <p role="alert" className="text-sm text-destructive">
                {t('verifications.reject.reasonRequired')}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" disabled={pending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" size="sm" disabled={pending}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
