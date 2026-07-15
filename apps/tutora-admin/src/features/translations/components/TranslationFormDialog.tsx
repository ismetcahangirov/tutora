import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@shared/i18n/languages';
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
  Textarea,
} from '@shared/ui';

import { useCreateTranslation, useUpdateTranslation } from '../hooks/useTranslations';
import {
  DEFAULT_FORM_NAMESPACE,
  descriptionSchema,
  keySchema,
  namespaceSchema,
  VALUE_MAX_LENGTH,
  type CreateTranslationBody,
  type Translation,
  type TranslationValues,
  type UpdateTranslationBody,
} from '../types';

type FieldError = 'namespace' | 'key' | 'description' | null;

/** Reads the initial per-locale values from an entry into a form-friendly map. */
function initialValues(entry: Translation | null): Record<string, string> {
  const values: Record<string, string> = {};
  for (const locale of SUPPORTED_LANGUAGES) {
    values[locale] = entry?.values[locale as keyof TranslationValues] ?? '';
  }
  return values;
}

/** Keeps only the locales with a non-empty value, as the API body. */
function toValuesBody(values: Record<string, string>): TranslationValues {
  const body: TranslationValues = {};
  for (const locale of SUPPORTED_LANGUAGES) {
    const value = values[locale];
    if (value && value.length > 0) body[locale as keyof TranslationValues] = value;
  }
  return body;
}

/**
 * Create or edit a translation key (issue #85). State is seeded from `entry` and
 * the dialog is remounted per entry (via `key`), so no effect syncs props.
 * `namespace` and `key` are the entry's identity: chosen on create, shown
 * read-only on edit.
 */
export function TranslationFormDialog({
  entry,
  onOpenChange,
}: {
  /** The entry being edited, or `null` to create a new one. */
  entry: Translation | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateTranslation();
  const update = useUpdateTranslation();
  const mutation = entry ? update : create;

  const [namespace, setNamespace] = useState(entry?.namespace ?? DEFAULT_FORM_NAMESPACE);
  const [key, setKey] = useState(entry?.key ?? '');
  const [description, setDescription] = useState(entry?.description ?? '');
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(entry));
  const [fieldError, setFieldError] = useState<FieldError>(null);

  const setValue = (locale: string, value: string) =>
    setValues((prev) => ({ ...prev, [locale]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedDescription = description.trim();
    if (trimmedDescription && !descriptionSchema.safeParse(trimmedDescription).success) {
      return setFieldError('description');
    }

    const onSuccess = () => onOpenChange(false);

    if (entry) {
      const patch: UpdateTranslationBody = {
        description: trimmedDescription || undefined,
        values: toValuesBody(values),
      };
      update.mutate({ id: entry.id, body: patch }, { onSuccess });
      return;
    }

    const parsedNamespace = namespaceSchema.safeParse(namespace);
    if (!parsedNamespace.success) return setFieldError('namespace');

    const parsedKey = keySchema.safeParse(key);
    if (!parsedKey.success) return setFieldError('key');

    setFieldError(null);
    const created: CreateTranslationBody = {
      namespace: parsedNamespace.data,
      key: parsedKey.data,
      description: trimmedDescription || undefined,
      values: toValuesBody(values),
    };
    create.mutate(created, { onSuccess });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>
            {t(entry ? 'translations.form.editTitle' : 'translations.form.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('translations.form.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="translation-namespace">{t('translations.form.namespace')}</Label>
                {entry ? (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
                    {entry.namespace}
                  </p>
                ) : (
                  <>
                    <Input
                      id="translation-namespace"
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      autoComplete="off"
                      placeholder="common"
                      required
                    />
                    {fieldError === 'namespace' ? (
                      <p role="alert" className="text-sm text-destructive">
                        {t('translations.form.namespaceInvalid')}
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="translation-key">{t('translations.form.key')}</Label>
                {entry ? (
                  <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground">
                    {entry.key}
                  </p>
                ) : (
                  <>
                    <Input
                      id="translation-key"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      autoComplete="off"
                      placeholder="filter.district"
                      required
                    />
                    {fieldError === 'key' ? (
                      <p role="alert" className="text-sm text-destructive">
                        {t('translations.form.keyInvalid')}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="translation-description">{t('translations.form.description')}</Label>
              <Input
                id="translation-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                placeholder={t('translations.form.descriptionPlaceholder')}
              />
              {fieldError === 'description' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('translations.form.descriptionInvalid')}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Label>{t('translations.form.values')}</Label>
              {SUPPORTED_LANGUAGES.map((locale) => (
                <div key={locale} className="space-y-1.5">
                  <Label
                    htmlFor={`translation-value-${locale}`}
                    className="text-xs font-normal text-muted-foreground"
                  >
                    {LANGUAGE_LABELS[locale]}
                  </Label>
                  <Textarea
                    id={`translation-value-${locale}`}
                    value={values[locale] ?? ''}
                    onChange={(e) => setValue(locale, e.target.value)}
                    maxLength={VALUE_MAX_LENGTH}
                    rows={2}
                  />
                </div>
              ))}
            </div>

            {mutation.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('translations.form.error')}
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
              {t(entry ? 'common.save' : 'translations.form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
