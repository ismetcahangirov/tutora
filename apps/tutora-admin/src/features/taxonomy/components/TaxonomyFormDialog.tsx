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
} from '@shared/ui';

import { useCreateTaxonomyItem, useUpdateTaxonomyItem } from '../hooks/useTaxonomyMutations';
import {
  codeSchema,
  nameSchema,
  slugSchema,
  type TaxonomyItem,
  type TaxonomyKind,
  type TaxonomyKindConfig,
  type TaxonomyWriteBody,
} from '../types';

type FieldError = 'name' | 'identifier' | null;

/**
 * Create or edit a taxonomy item (issue #65). State is seeded from `item` and
 * the dialog is remounted per item (via `key`), so no effect syncs props. The
 * form validates name and the kind's identifier (slug/code) client-side, then
 * sends the exact fields the API's DTO expects.
 */
export function TaxonomyFormDialog({
  kind,
  config,
  item,
  categories,
  onOpenChange,
}: {
  kind: TaxonomyKind;
  config: TaxonomyKindConfig;
  /** The item being edited, or `null` to create a new one. */
  item: TaxonomyItem | null;
  /** Category options for the subject form. */
  categories: TaxonomyItem[];
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateTaxonomyItem(kind);
  const update = useUpdateTaxonomyItem(kind);
  const mutation = item ? update : create;

  const [name, setName] = useState(item?.name ?? '');
  const [identifier, setIdentifier] = useState(item?.slug ?? item?.code ?? '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '');
  const [fieldError, setFieldError] = useState<FieldError>(null);

  const identifierSchema = config.field === 'code' ? codeSchema : slugSchema;
  const identifierLabel = t(config.field === 'code' ? 'taxonomy.form.code' : 'taxonomy.form.slug');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const parsedName = nameSchema.safeParse(name);
    if (!parsedName.success) {
      setFieldError('name');
      return;
    }
    const parsedIdentifier = identifierSchema.safeParse(identifier);
    if (!parsedIdentifier.success) {
      setFieldError('identifier');
      return;
    }
    setFieldError(null);

    const body: TaxonomyWriteBody = { name: parsedName.data };
    if (config.field === 'code') body.code = parsedIdentifier.data;
    else body.slug = parsedIdentifier.data;
    // Subjects may belong to a category; an empty selection clears it.
    if (config.hasCategory) body.categoryId = categoryId || null;

    const onSuccess = () => onOpenChange(false);
    if (item) update.mutate({ id: item.id, body }, { onSuccess });
    else create.mutate(body, { onSuccess });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>
            {t(item ? 'taxonomy.form.editTitle' : 'taxonomy.form.createTitle', {
              kind: t(`taxonomy.singular.${kind}`),
            })}
          </DialogTitle>
          <DialogDescription>{t('taxonomy.form.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="taxonomy-name">{t('taxonomy.form.name')}</Label>
              <Input
                id="taxonomy-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
                required
              />
              {fieldError === 'name' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('taxonomy.form.nameRequired')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taxonomy-identifier">{identifierLabel}</Label>
              <Input
                id="taxonomy-identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="off"
                placeholder={config.field === 'code' ? 'az' : 'mathematics'}
                required
              />
              {fieldError === 'identifier' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t(
                    config.field === 'code'
                      ? 'taxonomy.form.invalidCode'
                      : 'taxonomy.form.invalidSlug',
                  )}
                </p>
              ) : null}
            </div>

            {config.hasCategory ? (
              <div className="space-y-1.5">
                <Label htmlFor="taxonomy-category">{t('taxonomy.form.category')}</Label>
                <Select
                  id="taxonomy-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">{t('taxonomy.form.noCategory')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            {mutation.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('taxonomy.form.error')}
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
              {t(item ? 'taxonomy.form.save' : 'taxonomy.form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
