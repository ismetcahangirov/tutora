import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui';
import { formatDateTime } from '@shared/utils/formatDate';

import type { AuditLog } from '../types';
import { CategoryBadge } from './CategoryBadge';

/** A single labelled field in the detail grid. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

const EMPTY = '—';

/** Read-only detail view for one audit entry, including its metadata payload. */
export function AuditLogDetailDialog({
  log,
  onOpenChange,
}: {
  log: AuditLog;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const hasMetadata = log.metadata !== null && log.metadata !== undefined;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{t('logs.detail.title')}</DialogTitle>
          <DialogDescription className="font-mono">{log.action}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <dl className="grid grid-cols-2 gap-4">
            <Field label={t('logs.detail.category')}>
              <CategoryBadge category={log.category} />
            </Field>
            <Field label={t('logs.detail.time')}>
              {formatDateTime(log.createdAt, i18n.language)}
            </Field>
            <Field label={t('logs.detail.actor')}>{log.actorEmail}</Field>
            <Field label={t('logs.detail.ip')}>{log.ip ?? EMPTY}</Field>
            <Field label={t('logs.detail.entity')}>
              {log.entityType ? (
                <span>
                  {log.entityType}
                  {log.entityId ? (
                    <span className="text-muted-foreground"> · {log.entityId}</span>
                  ) : null}
                </span>
              ) : (
                EMPTY
              )}
            </Field>
            <Field label={t('logs.detail.actorId')}>{log.actorId ?? EMPTY}</Field>
          </dl>

          {log.userAgent ? (
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('logs.detail.userAgent')}
              </dt>
              <dd className="break-words text-sm text-muted-foreground">{log.userAgent}</dd>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('logs.detail.metadata')}
            </p>
            {hasMetadata ? (
              <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">{t('logs.detail.noMetadata')}</p>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
