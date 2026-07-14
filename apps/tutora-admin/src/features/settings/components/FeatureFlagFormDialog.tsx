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

import { useCreateFeatureFlag, useUpdateFeatureFlag } from '../hooks/useFeatureFlags';
import {
  configKeySchema,
  descriptionSchema,
  MAX_ROLLOUT,
  MIN_ROLLOUT,
  rolloutSchema,
  type CreateFeatureFlagBody,
  type FeatureFlag,
  type UpdateFeatureFlagBody,
} from '../types';

type FieldError = 'key' | 'rollout' | 'description' | null;

/**
 * Create or edit a feature flag (issue #70). State is seeded from `flag` and the
 * dialog is remounted per flag (via `key`), so no effect syncs props. `key` is a
 * flag's immutable identity: chosen on create, shown read-only on edit.
 */
export function FeatureFlagFormDialog({
  flag,
  onOpenChange,
}: {
  /** The flag being edited, or `null` to create a new one. */
  flag: FeatureFlag | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateFeatureFlag();
  const update = useUpdateFeatureFlag();
  const mutation = flag ? update : create;

  const [key, setKey] = useState(flag?.key ?? '');
  const [description, setDescription] = useState(flag?.description ?? '');
  const [enabled, setEnabled] = useState(flag?.enabled ?? false);
  const [rollout, setRollout] = useState(String(flag?.rolloutPercentage ?? 0));
  const [fieldError, setFieldError] = useState<FieldError>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedDescription = description.trim();
    if (trimmedDescription && !descriptionSchema.safeParse(trimmedDescription).success) {
      return setFieldError('description');
    }

    const parsedRollout = rolloutSchema.safeParse(Number(rollout));
    if (!parsedRollout.success) return setFieldError('rollout');

    setFieldError(null);

    const onSuccess = () => onOpenChange(false);

    if (flag) {
      const body: UpdateFeatureFlagBody = {
        description: trimmedDescription || undefined,
        enabled,
        rolloutPercentage: parsedRollout.data,
      };
      update.mutate({ id: flag.id, body }, { onSuccess });
      return;
    }

    const parsedKey = configKeySchema.safeParse(key);
    if (!parsedKey.success) return setFieldError('key');

    const body: CreateFeatureFlagBody = {
      key: parsedKey.data,
      description: trimmedDescription || undefined,
      enabled,
      rolloutPercentage: parsedRollout.data,
    };
    create.mutate(body, { onSuccess });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>
            {t(flag ? 'settings.flagForm.editTitle' : 'settings.flagForm.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('settings.flagForm.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="flag-key">{t('settings.flagForm.key')}</Label>
              {flag ? (
                <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground">
                  {flag.key}
                </p>
              ) : (
                <>
                  <Input
                    id="flag-key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    autoComplete="off"
                    placeholder="in_app_payments"
                    required
                  />
                  {fieldError === 'key' ? (
                    <p role="alert" className="text-sm text-destructive">
                      {t('settings.flagForm.keyInvalid')}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="flag-description">{t('settings.flagForm.description')}</Label>
              <Input
                id="flag-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoComplete="off"
                maxLength={200}
              />
              {fieldError === 'description' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('settings.flagForm.descriptionInvalid')}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="flag-enabled">{t('settings.flagForm.enabled')}</Label>
                <Select
                  id="flag-enabled"
                  value={enabled ? 'true' : 'false'}
                  onChange={(e) => setEnabled(e.target.value === 'true')}
                >
                  <option value="true">{t('settings.flagForm.on')}</option>
                  <option value="false">{t('settings.flagForm.off')}</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="flag-rollout">{t('settings.flagForm.rollout')}</Label>
                <Input
                  id="flag-rollout"
                  type="number"
                  inputMode="numeric"
                  min={MIN_ROLLOUT}
                  max={MAX_ROLLOUT}
                  step="1"
                  value={rollout}
                  onChange={(e) => setRollout(e.target.value)}
                  required
                />
                {fieldError === 'rollout' ? (
                  <p role="alert" className="text-sm text-destructive">
                    {t('settings.flagForm.rolloutInvalid')}
                  </p>
                ) : null}
              </div>
            </div>

            {mutation.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('settings.flagForm.error')}
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
              {t(flag ? 'common.save' : 'settings.flagForm.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
