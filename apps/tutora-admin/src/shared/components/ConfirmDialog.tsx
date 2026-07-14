import { useTranslation } from 'react-i18next';

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui';

/**
 * Reusable confirmation modal for a single, consequential action (suspend,
 * approve, reject…). Keeps the trigger's mutation state — `pending` disables the
 * buttons, `error` surfaces a failure inline rather than dismissing silently.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending = false,
  destructive = false,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  destructive?: boolean;
  error?: string | null;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {error ? (
          <DialogBody>
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          </DialogBody>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm" disabled={pending}>
              {t('common.cancel')}
            </Button>
          </DialogClose>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
