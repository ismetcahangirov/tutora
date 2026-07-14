/**
 * useTutorProfileCollections — add/remove the profile's taxonomy links
 * (subjects, districts, languages) plus per-subject pricing (tutor epic #51,
 * #53, #56).
 *
 * These six endpoints share one shape — each mutates a collection and returns the
 * *full* refreshed profile — so they are grouped into one cohesive hook that the
 * Profile editor drives, rather than six near-identical files. Every success
 * writes the returned profile straight into the `me` cache. Per-kind pending flags
 * let the UI disable just the row being changed.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  addTutorDistrict,
  addTutorLanguage,
  removeTutorDistrict,
  removeTutorLanguage,
  removeTutorSubject,
  upsertTutorSubject,
} from '../api/tutor-profile.api';
import { tutorProfileKeys } from '../constants';
import type { MyTutorProfile, UpsertTutorSubjectInput } from '../types';

export type UseTutorProfileCollectionsResult = {
  upsertSubject: (input: UpsertTutorSubjectInput) => Promise<MyTutorProfile>;
  removeSubject: (subjectId: string) => Promise<MyTutorProfile>;
  addDistrict: (districtId: string) => Promise<MyTutorProfile>;
  removeDistrict: (districtId: string) => Promise<MyTutorProfile>;
  addLanguage: (languageId: string) => Promise<MyTutorProfile>;
  removeLanguage: (languageId: string) => Promise<MyTutorProfile>;
  /** True while any subject mutation is in flight. */
  isSubjectMutating: boolean;
  /** True while any district mutation is in flight. */
  isDistrictMutating: boolean;
  /** True while any language mutation is in flight. */
  isLanguageMutating: boolean;
};

export function useTutorProfileCollections(): UseTutorProfileCollectionsResult {
  const queryClient = useQueryClient();
  const onSuccess = (profile: MyTutorProfile) => {
    queryClient.setQueryData(tutorProfileKeys.me(), profile);
  };

  const upsertSubjectM = useMutation({ mutationFn: upsertTutorSubject, onSuccess });
  const removeSubjectM = useMutation({ mutationFn: removeTutorSubject, onSuccess });
  const addDistrictM = useMutation({ mutationFn: addTutorDistrict, onSuccess });
  const removeDistrictM = useMutation({ mutationFn: removeTutorDistrict, onSuccess });
  const addLanguageM = useMutation({ mutationFn: addTutorLanguage, onSuccess });
  const removeLanguageM = useMutation({ mutationFn: removeTutorLanguage, onSuccess });

  return {
    upsertSubject: upsertSubjectM.mutateAsync,
    removeSubject: removeSubjectM.mutateAsync,
    addDistrict: addDistrictM.mutateAsync,
    removeDistrict: removeDistrictM.mutateAsync,
    addLanguage: addLanguageM.mutateAsync,
    removeLanguage: removeLanguageM.mutateAsync,
    isSubjectMutating: upsertSubjectM.isPending || removeSubjectM.isPending,
    isDistrictMutating: addDistrictM.isPending || removeDistrictM.isPending,
    isLanguageMutating: addLanguageM.isPending || removeLanguageM.isPending,
  };
}
