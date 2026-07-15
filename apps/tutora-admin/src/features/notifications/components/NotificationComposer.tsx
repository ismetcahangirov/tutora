import { CheckCircle2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Input, Label, Select, Textarea } from '@shared/ui';
import { ConfirmDialog } from '@shared/components';

import { useBroadcastNotification } from '../hooks/useBroadcastNotification';
import {
  BROADCAST_NOTIFICATION_TYPES,
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_BODY_MAX_LENGTH,
  NOTIFICATION_TITLE_MAX_LENGTH,
  type BroadcastNotificationType,
  type NotificationAudience,
} from '../types';
import { NotificationPreview } from './NotificationPreview';

/** Outcome banner shown after a send — recipient count, or an "empty segment" note. */
function ResultBanner({ recipients, onDismiss }: { recipients: number; onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex-1 space-y-2">
        <p className="text-sm text-foreground">
          {recipients > 0
            ? t('notifications.result.success', { total: recipients })
            : t('notifications.result.empty')}
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={onDismiss}>
          {t('notifications.result.composeAnother')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Notification composer (issue #66): compose a push, pick an audience segment,
 * and send it. A confirm step guards the irreversible fan-out, and the recipient
 * count is surfaced on success. Sending clears the title/body so the same message
 * can't be dispatched twice by accident.
 */
export function NotificationComposer() {
  const { t } = useTranslation();
  const broadcast = useBroadcastNotification();

  const [audience, setAudience] = useState<NotificationAudience>('ALL');
  const [type, setType] = useState<BroadcastNotificationType>('ANNOUNCEMENT');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [missingTitle, setMissingTitle] = useState(false);
  const [missingBody, setMissingBody] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const noTitle = !title.trim();
    const noBody = !body.trim();
    setMissingTitle(noTitle);
    setMissingBody(noBody);
    if (noTitle || noBody) return;
    // Clear any prior send's banner so a fresh flow starts clean.
    if (broadcast.isError || broadcast.isSuccess) broadcast.reset();
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    broadcast.mutate(
      { audience, type, title: title.trim(), body: body.trim() },
      {
        onSuccess: () => {
          setShowConfirm(false);
          setTitle('');
          setBody('');
        },
      },
    );
  };

  return (
    <>
      {broadcast.isSuccess ? (
        <div className="mb-6">
          <ResultBanner
            recipients={broadcast.data.recipients}
            onDismiss={() => broadcast.reset()}
          />
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="notification-audience">{t('notifications.form.audience')}</Label>
            <Select
              id="notification-audience"
              value={audience}
              onChange={(event) => {
                const next = NOTIFICATION_AUDIENCES.find((a) => a === event.target.value);
                if (next) setAudience(next);
              }}
            >
              {NOTIFICATION_AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {t(`notifications.audiences.${a}`)}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {t(`notifications.audienceHint.${audience}`)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notification-type">{t('notifications.form.type')}</Label>
            <Select
              id="notification-type"
              value={type}
              onChange={(event) => {
                const next = BROADCAST_NOTIFICATION_TYPES.find((x) => x === event.target.value);
                if (next) setType(next);
              }}
            >
              {BROADCAST_NOTIFICATION_TYPES.map((x) => (
                <option key={x} value={x}>
                  {t(`notifications.types.${x}`)}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notification-title">{t('notifications.form.titleLabel')}</Label>
            <Input
              id="notification-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={NOTIFICATION_TITLE_MAX_LENGTH}
              placeholder={t('notifications.form.titlePlaceholder')}
              aria-invalid={missingTitle}
            />
            <div className="flex items-center justify-between">
              {missingTitle ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('notifications.form.titleRequired')}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {t('notifications.form.charCount', {
                  current: title.length,
                  max: NOTIFICATION_TITLE_MAX_LENGTH,
                })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notification-body">{t('notifications.form.bodyLabel')}</Label>
            <Textarea
              id="notification-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={NOTIFICATION_BODY_MAX_LENGTH}
              rows={5}
              placeholder={t('notifications.form.bodyPlaceholder')}
              aria-invalid={missingBody}
            />
            <div className="flex items-center justify-between">
              {missingBody ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('notifications.form.bodyRequired')}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {t('notifications.form.charCount', {
                  current: body.length,
                  max: NOTIFICATION_BODY_MAX_LENGTH,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <NotificationPreview title={title} body={body} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={broadcast.isPending}>
              {t('notifications.form.submit')}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => !broadcast.isPending && setShowConfirm(open)}
        title={t('notifications.confirm.title')}
        description={t('notifications.confirm.description', {
          audience: t(`notifications.audiences.${audience}`),
        })}
        confirmLabel={t('notifications.confirm.send')}
        onConfirm={handleConfirm}
        pending={broadcast.isPending}
        error={broadcast.isError ? t('notifications.error') : null}
      />
    </>
  );
}
