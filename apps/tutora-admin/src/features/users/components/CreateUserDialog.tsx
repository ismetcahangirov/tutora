import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

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

import { useCreateUser } from '../hooks/useUserMutations';
import type { CreateUserBody } from '../types';

const emailSchema = z.string().email();

/** Provision a shell user account by email, optionally pre-assigning a role. */
export function CreateUserDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const create = useCreateUser();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [invalidEmail, setInvalidEmail] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setInvalidEmail(true);
      return;
    }
    setInvalidEmail(false);

    const body: CreateUserBody = { email: parsed.data };
    const trimmedName = name.trim();
    if (trimmedName) body.name = trimmedName;
    if (role) body.role = role;
    create.mutate(body, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{t('users.create.title')}</DialogTitle>
          <DialogDescription>{t('users.create.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-user-email">{t('users.create.email')}</Label>
              <Input
                id="create-user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="off"
                required
              />
              {invalidEmail ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('users.create.invalidEmail')}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-user-name">{t('users.create.name')}</Label>
              <Input
                id="create-user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-user-role">{t('users.create.role')}</Label>
              <Select
                id="create-user-role"
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
            {create.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('users.create.error')}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" disabled={create.isPending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {t('users.create.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
