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
  Input,
  Label,
  Select,
  Separator,
} from '@shared/ui';
import { formatDateTime } from '@shared/utils/formatDate';
import { formatMoney } from '@shared/utils/formatMoney';

import { nextPaymentStatuses } from '../constants';
import { useUpdatePaymentStatus } from '../hooks/usePaymentMutations';
import {
  PROVIDER_REF_MAX_LENGTH,
  type AdminPayment,
  type PaymentStatus,
  type UpdatePaymentStatusBody,
} from '../types';
import { PaymentStatusBadge } from './PaymentStatusBadge';

/**
 * Reconcile a payment (issue #68): move it to a legal next status and record an
 * optional provider reference. Only transitions allowed by the lifecycle state
 * machine are offered (see {@link nextPaymentStatuses}); a refund is the
 * SUCCEEDED → REFUNDED edge. State is seeded from the payment and the dialog is
 * remounted per payment (via `key`), so no effect syncs props.
 */
export function PaymentStatusDialog({
  payment,
  onOpenChange,
}: {
  payment: AdminPayment;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const update = useUpdatePaymentStatus();

  const options = nextPaymentStatuses(payment.status);
  const [status, setStatus] = useState<PaymentStatus | undefined>(options[0]);
  const [providerRef, setProviderRef] = useState(payment.providerRef ?? '');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!status) return;

    const body: UpdatePaymentStatusBody = { status };
    const trimmedRef = providerRef.trim();
    if (trimmedRef) body.providerRef = trimmedRef;

    update.mutate({ id: payment.id, body }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{t('payments.reconcile.title')}</DialogTitle>
          <DialogDescription>{t('payments.reconcile.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-5">
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {payment.userName ?? payment.userEmail}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{payment.userEmail}</p>
                </div>
                <p className="whitespace-nowrap text-sm font-semibold text-foreground">
                  {formatMoney(payment.amount, payment.currency, i18n.language)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <PaymentStatusBadge status={payment.status} />
                <span>{formatDateTime(payment.createdAt, i18n.language)}</span>
                {payment.provider ? <span>{payment.provider}</span> : null}
              </div>
            </div>

            <Separator />

            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('payments.reconcile.terminal')}</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="payment-status">{t('payments.reconcile.newStatus')}</Label>
                  <Select
                    id="payment-status"
                    value={status ?? ''}
                    onChange={(event) => {
                      const next = options.find((s) => s === event.target.value);
                      if (next) setStatus(next);
                    }}
                  >
                    {options.map((s) => (
                      <option key={s} value={s}>
                        {t(`payments.paymentStatus.${s}`)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment-provider-ref">
                    {t('payments.reconcile.providerRef')}
                  </Label>
                  <Input
                    id="payment-provider-ref"
                    value={providerRef}
                    onChange={(event) => setProviderRef(event.target.value)}
                    maxLength={PROVIDER_REF_MAX_LENGTH}
                    autoComplete="off"
                    placeholder={t('payments.reconcile.providerRefPlaceholder')}
                  />
                </div>
              </>
            )}

            {update.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('payments.reconcile.error')}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" disabled={update.isPending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              variant={status === 'REFUNDED' || status === 'FAILED' ? 'destructive' : 'primary'}
              disabled={update.isPending || options.length === 0}
            >
              {t('payments.reconcile.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
