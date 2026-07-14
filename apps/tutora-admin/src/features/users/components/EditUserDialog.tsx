import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { USER_ROLES, type UserRole } from '@shared/rbac';
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

import { useUpdateUser } from '../hooks/useUserMutations';
import type { AdminUser, UpdateUserBody } from '../types';

/**
 * Edit a user's name, role, and lifecycle flags. State is seeded from the user
 * and the dialog is remounted per user (via `key`), so no effect is needed to
 * sync props. Only changed fields are sent as a partial update.
 */
export function EditUserDialog({
  user,
  onOpenChange,
}: {
  user: AdminUser;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateUser();

  const [name, setName] = useState(user.name ?? '');
  const [role, setRole] = useState<UserRole | ''>(user.role ?? '');
  const [emailVerified, setEmailVerified] = useState(user.emailVerified);
  const [onboardingCompleted, setOnboardingCompleted] = useState(user.onboardingCompleted);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const body: UpdateUserBody = {};
    const trimmed = name.trim();
    if (trimmed !== (user.name ?? '')) body.name = trimmed;
    if (role && role !== user.role) body.role = role;
    if (emailVerified !== user.emailVerified) body.emailVerified = emailVerified;
    if (onboardingCompleted !== user.onboardingCompleted) {
      body.onboardingCompleted = onboardingCompleted;
    }
    update.mutate({ id: user.id, body }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{t('users.edit.title')}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-name">{t('users.edit.name')}</Label>
              <Input
                id="edit-user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-role">{t('users.edit.role')}</Label>
              <Select
                id="edit-user-role"
                value={role}
                onChange={(event) =>
                  setRole(USER_ROLES.find((r) => r === event.target.value) ?? '')
                }
              >
                <option value="">{t('roles.none')}</option>
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}`)}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={emailVerified}
                onChange={(event) => setEmailVerified(event.target.checked)}
                className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              {t('users.edit.emailVerified')}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={onboardingCompleted}
                onChange={(event) => setOnboardingCompleted(event.target.checked)}
                className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              {t('users.edit.onboarding')}
            </label>
            {update.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('users.edit.error')}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" disabled={update.isPending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={update.isPending}>
              {t('users.edit.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
