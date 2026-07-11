/**
 * useRoleSelection — the role-selection surface for the screen (issue #23).
 *
 * Owns the local selection, the submit lifecycle, and the error. On success it
 * pushes the updated user into auth state via `updateUser`; the routing gate
 * reacts to the now-set role and navigates onward — no imperative navigation
 * here, so the hook stays pure and testable.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@features/auth';

import { completeOnboarding } from '../api/onboarding.api';
import type { SelectableRole } from '../types';

export type UseRoleSelection = {
  selectedRole: SelectableRole | null;
  selectRole: (role: SelectableRole) => void;
  submit: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
};

export function useRoleSelection(): UseRoleSelection {
  const { updateUser } = useAuth();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectRole = useCallback((role: SelectableRole) => {
    setSelectedRole(role);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (!selectedRole || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await completeOnboarding(selectedRole);
      updateUser(user);
    } catch (submitError) {
      console.warn('[onboarding] Failed to save role', submitError);
      setError(t('onboarding.role.error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRole, isSubmitting, updateUser, t]);

  return { selectedRole, selectRole, submit, isSubmitting, error };
}
