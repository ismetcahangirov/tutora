/**
 * useCertificates — add (upload + register) and remove the tutor's certificates
 * (tutor epic #51, #54).
 *
 * Adding is a three-step flow — mint a signed ticket, PUT the bytes to storage,
 * register the `fileUrl` — surfaced as one `createCertificate` call. Because these
 * endpoints return the *certificate* (not the whole profile), each success splices
 * the result into the cached `me` profile directly, keeping the Profile tab in sync
 * with no refetch. `deletingId` lets the UI spin only the row being removed.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCertificate, createUploadTicket, deleteCertificate } from '../api/certificates.api';
import { tutorProfileKeys } from '../constants';
import { uploadCertificateFile } from '../services/certificate-files';
import type { MyTutorProfile, PickedCertificate, TutorCertificate } from '../types';

/** Args for adding a certificate: the metadata plus the picked, validated file. */
export type CreateCertificateArgs = {
  title: string;
  issuedBy?: string;
  file: PickedCertificate;
};

export type UseCertificatesResult = {
  createCertificate: (args: CreateCertificateArgs) => Promise<TutorCertificate>;
  deleteCertificate: (certificateId: string) => Promise<void>;
  isCreating: boolean;
  /** The id of the certificate currently being deleted, or `null`. */
  deletingId: string | null;
};

export function useCertificates(): UseCertificatesResult {
  const queryClient = useQueryClient();

  const createM = useMutation({
    mutationFn: async ({ title, issuedBy, file }: CreateCertificateArgs) => {
      const ticket = await createUploadTicket({
        purpose: 'CERTIFICATE',
        contentType: file.contentType,
      });
      await uploadCertificateFile(ticket, file);
      return createCertificate({ title, fileUrl: ticket.fileUrl, issuedBy });
    },
    onSuccess: (certificate) => {
      queryClient.setQueryData<MyTutorProfile>(tutorProfileKeys.me(), (prev) =>
        prev ? { ...prev, certificates: [certificate, ...prev.certificates] } : prev,
      );
    },
  });

  const deleteM = useMutation({
    mutationFn: (certificateId: string) => deleteCertificate(certificateId),
    onSuccess: (_result, certificateId) => {
      queryClient.setQueryData<MyTutorProfile>(tutorProfileKeys.me(), (prev) =>
        prev
          ? { ...prev, certificates: prev.certificates.filter((c) => c.id !== certificateId) }
          : prev,
      );
    },
  });

  return {
    createCertificate: createM.mutateAsync,
    deleteCertificate: deleteM.mutateAsync,
    isCreating: createM.isPending,
    deletingId: deleteM.isPending ? (deleteM.variables ?? null) : null,
  };
}
