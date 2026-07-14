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
  Textarea,
} from '@shared/ui';

import { useCreateSystemSetting, useUpdateSystemSetting } from '../hooks/useSystemSettings';
import {
  configKeySchema,
  descriptionSchema,
  type CreateSystemSettingBody,
  type SystemSetting,
  type UpdateSystemSettingBody,
} from '../types';

type FieldError = 'key' | 'value' | 'description' | null;

/** Pretty-prints a stored value as editable JSON text. */
function toJsonText(value: unknown): string {
  return JSON.stringify(value ?? '', null, 2);
}

/**
 * Create or edit a system setting (issue #70). The value is edited as raw JSON
 * (scalar, array, or object) and parsed on submit. State is seeded from
 * `setting` and the dialog is remounted per setting (via `key`), so no effect
 * syncs props. `key` is immutable: chosen on create, read-only on edit.
 */
export function SystemSettingFormDialog({
  setting,
  onOpenChange,
}: {
  /** The setting being edited, or `null` to create a new one. */
  setting: SystemSetting | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateSystemSetting();
  const update = useUpdateSystemSetting();
  const mutation = setting ? update : create;

  const [key, setKey] = useState(setting?.key ?? '');
  const [valueText, setValueText] = useState(() => (setting ? toJsonText(setting.value) : ''));
  const [description, setDescription] = useState(setting?.description ?? '');
  const [fieldError, setFieldError] = useState<FieldError>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedDescription = description.trim();
    if (trimmedDescription && !descriptionSchema.safeParse(trimmedDescription).success) {
      return setFieldError('description');
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(valueText) as unknown;
    } catch {
      return setFieldError('value');
    }

    setFieldError(null);

    const onSuccess = () => onOpenChange(false);

    if (setting) {
      const body: UpdateSystemSettingBody = {
        value: parsedValue,
        description: trimmedDescription || undefined,
      };
      update.mutate({ id: setting.id, body }, { onSuccess });
      return;
    }

    const parsedKey = configKeySchema.safeParse(key);
    if (!parsedKey.success) return setFieldError('key');

    const body: CreateSystemSettingBody = {
      key: parsedKey.data,
      value: parsedValue,
      description: trimmedDescription || undefined,
    };
    create.mutate(body, { onSuccess });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>
            {t(setting ? 'settings.settingForm.editTitle' : 'settings.settingForm.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('settings.settingForm.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="setting-key">{t('settings.settingForm.key')}</Label>
              {setting ? (
                <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground">
                  {setting.key}
                </p>
              ) : (
                <>
                  <Input
                    id="setting-key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    autoComplete="off"
                    placeholder="support_email"
                    required
                  />
                  {fieldError === 'key' ? (
                    <p role="alert" className="text-sm text-destructive">
                      {t('settings.settingForm.keyInvalid')}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setting-value">{t('settings.settingForm.value')}</Label>
              <Textarea
                id="setting-value"
                value={valueText}
                onChange={(e) => setValueText(e.target.value)}
                className="min-h-28 font-mono text-xs"
                spellCheck={false}
                placeholder={'"support@tutora.app"'}
                required
              />
              <p className="text-xs text-muted-foreground">{t('settings.settingForm.valueHint')}</p>
              {fieldError === 'value' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('settings.settingForm.valueInvalid')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setting-description">{t('settings.settingForm.description')}</Label>
              <Input
                id="setting-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoComplete="off"
                maxLength={200}
              />
              {fieldError === 'description' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('settings.settingForm.descriptionInvalid')}
                </p>
              ) : null}
            </div>

            {mutation.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('settings.settingForm.error')}
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
              {t(setting ? 'common.save' : 'settings.settingForm.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
