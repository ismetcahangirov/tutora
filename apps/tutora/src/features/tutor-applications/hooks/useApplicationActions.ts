/**
 * useApplicationActions — accept / decline / complete an application (tutor epic
 * #51, #57).
 *
 * One mutation over the three actions, keyed by the target id so the UI can show a
 * spinner on exactly the card being acted on (`pendingId`). A status change moves
 * an application between the filtered lists, so on success every applications
 * query is invalidated rather than patched in place.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  acceptApplication,
  completeApplication,
  declineApplication,
} from '../api/applications.api';
import { applicationKeys } from '../constants';
import type { ApplicationAction, TutorApplication } from '../types';

const ACTION_FN: Record<ApplicationAction, (id: string) => Promise<TutorApplication>> = {
  accept: acceptApplication,
  decline: declineApplication,
  complete: completeApplication,
};

export type UseApplicationActionsResult = {
  respond: (action: ApplicationAction, id: string) => Promise<TutorApplication>;
  /** The id currently being acted on, or null when idle. */
  pendingId: string | null;
};

export function useApplicationActions(): UseApplicationActionsResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ action, id }: { action: ApplicationAction; id: string }) =>
      ACTION_FN[action](id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });

  return {
    respond: (action, id) => mutation.mutateAsync({ action, id }),
    pendingId: mutation.isPending ? (mutation.variables?.id ?? null) : null,
  };
}
