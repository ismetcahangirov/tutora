import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { SUPPORTED_LANGUAGES } from '@shared/i18n/languages';
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
  Textarea,
} from '@shared/ui';

import { useCreateContent, useUpdateContent } from '../hooks/useContent';
import {
  bodySchema,
  CONTENT_STATUSES,
  DEFAULT_FORM_LOCALE,
  excerptSchema,
  slugSchema,
  titleSchema,
  type ContentEntry,
  type ContentStatus,
  type ContentType,
  type CreateContentBody,
  type UpdateContentBody,
} from '../types';

type FieldError = 'slug' | 'title' | 'body' | 'excerpt' | 'coverImageUrl' | null;

/** Cover image is optional; when present it must be an absolute URL. */
const coverImageSchema = z.string().trim().url();

/**
 * Create or edit a content entry (issue #67). State is seeded from `entry` and
 * the dialog is remounted per entry (via `key`), so no effect syncs props.
 * `type` and `locale` place the entry in its bucket: chosen on create, shown
 * read-only on edit.
 */
export function ContentFormDialog({
  entry,
  type,
  onOpenChange,
}: {
  /** The entry being edited, or `null` to create a new one. */
  entry: ContentEntry | null;
  /** The content type of the active tab, used when creating. */
  type: ContentType;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateContent();
  const update = useUpdateContent();
  const mutation = entry ? update : create;

  const [locale, setLocale] = useState(entry?.locale ?? DEFAULT_FORM_LOCALE);
  const [slug, setSlug] = useState(entry?.slug ?? '');
  const [title, setTitle] = useState(entry?.title ?? '');
  const [excerpt, setExcerpt] = useState(entry?.excerpt ?? '');
  const [body, setBody] = useState(entry?.body ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(entry?.coverImageUrl ?? '');
  const [order, setOrder] = useState(String(entry?.order ?? 0));
  const [status, setStatus] = useState<ContentStatus>(entry?.status ?? 'DRAFT');
  const [fieldError, setFieldError] = useState<FieldError>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const parsedTitle = titleSchema.safeParse(title);
    if (!parsedTitle.success) return setFieldError('title');

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) return setFieldError('body');

    const trimmedExcerpt = excerpt.trim();
    if (trimmedExcerpt && !excerptSchema.safeParse(trimmedExcerpt).success) {
      return setFieldError('excerpt');
    }

    const trimmedCover = coverImageUrl.trim();
    if (trimmedCover && !coverImageSchema.safeParse(trimmedCover).success) {
      return setFieldError('coverImageUrl');
    }

    const parsedSlug = slugSchema.safeParse(slug);
    if (!parsedSlug.success) return setFieldError('slug');

    setFieldError(null);
    const parsedOrder = Number.parseInt(order, 10);
    const safeOrder = Number.isFinite(parsedOrder) && parsedOrder >= 0 ? parsedOrder : 0;
    const onSuccess = () => onOpenChange(false);

    if (entry) {
      const patch: UpdateContentBody = {
        slug: parsedSlug.data,
        title: parsedTitle.data,
        excerpt: trimmedExcerpt || undefined,
        body: parsedBody.data,
        coverImageUrl: trimmedCover || undefined,
        order: safeOrder,
        status,
      };
      update.mutate({ id: entry.id, body: patch }, { onSuccess });
      return;
    }

    const created: CreateContentBody = {
      type,
      locale,
      slug: parsedSlug.data,
      title: parsedTitle.data,
      excerpt: trimmedExcerpt || undefined,
      body: parsedBody.data,
      coverImageUrl: trimmedCover || undefined,
      order: safeOrder,
      status,
    };
    create.mutate(created, { onSuccess });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{t(entry ? 'cms.form.editTitle' : 'cms.form.createTitle')}</DialogTitle>
          <DialogDescription>{t('cms.form.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('cms.form.type')}</Label>
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
                  {t(`cms.types.${entry?.type ?? type}`)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content-locale">{t('cms.form.locale')}</Label>
                {entry ? (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
                    {entry.locale.toUpperCase()}
                  </p>
                ) : (
                  <Select
                    id="content-locale"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content-title">{t('cms.form.title')}</Label>
              <Input
                id="content-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
              {fieldError === 'title' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('cms.form.titleInvalid')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content-slug">{t('cms.form.slug')}</Label>
              <Input
                id="content-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                autoComplete="off"
                placeholder="how-it-works"
                required
              />
              {fieldError === 'slug' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('cms.form.slugInvalid')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content-excerpt">{t('cms.form.excerpt')}</Label>
              <Input
                id="content-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                maxLength={300}
              />
              {fieldError === 'excerpt' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('cms.form.excerptInvalid')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content-body">{t('cms.form.body')}</Label>
              <Textarea
                id="content-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                required
              />
              {fieldError === 'body' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('cms.form.bodyInvalid')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content-cover">{t('cms.form.coverImageUrl')}</Label>
              <Input
                id="content-cover"
                type="url"
                inputMode="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                autoComplete="off"
                placeholder="https://…"
              />
              {fieldError === 'coverImageUrl' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('cms.form.coverImageUrlInvalid')}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="content-order">{t('cms.form.order')}</Label>
                <Input
                  id="content-order"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step="1"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content-status">{t('cms.form.status')}</Label>
                <Select
                  id="content-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContentStatus)}
                >
                  {CONTENT_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {t(`cms.status.${option}`)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {mutation.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('cms.form.error')}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" disabled={mutation.isPending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {t(entry ? 'common.save' : 'cms.form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
