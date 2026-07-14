import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * A device-style preview of the composed push (issue #66). Purely presentational:
 * it mirrors the title/body the audience will see, falling back to placeholder
 * copy so the shape stays visible while the composer is still empty.
 */
export function NotificationPreview({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation();

  const shownTitle = title.trim() || t('notifications.preview.titlePlaceholder');
  const shownBody = body.trim() || t('notifications.preview.bodyPlaceholder');
  const isEmpty = !title.trim() && !body.trim();

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('notifications.preview.label')}
      </p>
      <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 shadow-sm">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bell className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t('notifications.preview.appName')}
          </p>
          <p
            className={`truncate text-sm font-semibold ${
              isEmpty ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {shownTitle}
          </p>
          <p
            className={`mt-0.5 line-clamp-3 text-sm ${
              isEmpty ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {shownBody}
          </p>
        </div>
      </div>
    </div>
  );
}
