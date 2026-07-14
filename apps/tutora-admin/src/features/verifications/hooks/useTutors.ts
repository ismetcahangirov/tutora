import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getTutor, listTutors } from '../api/tutors.api';
import { verificationsKeys } from '../constants';
import type { ListTutorsParams } from '../types';

/** Verification queue list. Keeps the current page while the next one loads. */
export function useTutorsQuery(params: ListTutorsParams) {
  return useQuery({
    queryKey: verificationsKeys.list(params),
    queryFn: () => listTutors(params),
    placeholderData: keepPreviousData,
  });
}

/** Full tutor detail for the review dialog. */
export function useTutorQuery(id: string) {
  return useQuery({
    queryKey: verificationsKeys.detail(id),
    queryFn: () => getTutor(id),
  });
}
