/**
 * useStartThreadWithTutor — open (or fetch) a thread with a tutor, as a student
 * (#171 — wires the tutor detail screen's "Contact Tutor" CTA to real chat).
 *
 * The backend only opens a thread between a student and a tutor they have an
 * active application with; a caller without one gets a 403, which the screen
 * surfaces as an error toast rather than a silent no-op.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { startThreadWithTutor } from '../api/chat.api';
import { chatKeys } from '../constants';
import type { ChatThread } from '../types';

export type UseStartThreadWithTutorResult = {
  startThread: (tutorId: string) => Promise<ChatThread>;
  isStarting: boolean;
};

export function useStartThreadWithTutor(): UseStartThreadWithTutorResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (tutorId: string) => startThreadWithTutor(tutorId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
  });

  return { startThread: mutation.mutateAsync, isStarting: mutation.isPending };
}
