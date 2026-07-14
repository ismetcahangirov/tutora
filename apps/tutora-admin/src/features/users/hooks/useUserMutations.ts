import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createUser, restoreUser, suspendUser, updateUser } from '../api/users.api';
import { usersKeys } from '../constants';
import type { CreateUserBody, UpdateUserBody } from '../types';

/** Edit a user. Invalidates the list so the row reflects the new state. */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) => updateUser(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

/** Provision a shell user account. */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserBody) => createUser(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

/** Suspend (soft-delete) a user account. */
export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspendUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

/** Restore a suspended user account. */
export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}
