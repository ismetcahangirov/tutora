/**
 * useCertificates (#54) — the API + upload transport are mocked. We assert the
 * add flow runs ticket → upload → register in order and prepends the result to the
 * cached `me` profile, and that a delete splices the certificate back out.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { tutorProfileKeys } from '@features/tutor-profile/constants';
import type { MyTutorProfile, TutorCertificate, UploadTicket } from '@features/tutor-profile/types';

import {
  createCertificate,
  createUploadTicket,
  deleteCertificate,
} from '@features/tutor-profile/api/certificates.api';
import { uploadCertificateFile } from '@features/tutor-profile/services/certificate-files';

import { useCertificates } from '../useCertificates';

jest.mock('@features/tutor-profile/api/certificates.api', () => ({
  createUploadTicket: jest.fn(),
  createCertificate: jest.fn(),
  deleteCertificate: jest.fn(),
}));
jest.mock('@features/tutor-profile/services/certificate-files', () => ({
  uploadCertificateFile: jest.fn(),
}));

const mockedTicket = createUploadTicket as jest.MockedFunction<typeof createUploadTicket>;
const mockedCreate = createCertificate as jest.MockedFunction<typeof createCertificate>;
const mockedDelete = deleteCertificate as jest.MockedFunction<typeof deleteCertificate>;
const mockedUpload = uploadCertificateFile as jest.MockedFunction<typeof uploadCertificateFile>;

const ticket: UploadTicket = {
  uploadUrl: 'https://storage.example/put',
  method: 'PUT',
  headers: { 'Content-Type': 'application/pdf', 'x-goog-content-length-range': '0,10485760' },
  objectKey: 'certificates/u-1/abc.pdf',
  fileUrl: 'https://storage.example/certificates/u-1/abc.pdf',
  maxBytes: 10_485_760,
  expiresAt: '2026-01-01T00:15:00.000Z',
};

const newCertificate: TutorCertificate = {
  id: 'c-2',
  title: 'IELTS 8.0',
  fileUrl: ticket.fileUrl,
  status: 'PENDING',
  issuedBy: 'British Council',
  reviewedAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
};

const existing: TutorCertificate = {
  id: 'c-1',
  title: 'CELTA',
  fileUrl: 'https://storage.example/certificates/u-1/celta.pdf',
  status: 'VERIFIED',
  issuedBy: null,
  reviewedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2025-12-01T00:00:00.000Z',
};

const baseProfile: MyTutorProfile = {
  id: 'tp-1',
  userId: 'u-1',
  name: 'Aygün',
  avatarUrl: null,
  bio: null,
  experienceYears: 6,
  hourlyRate: 30,
  pricingTiers: [{ period: 'HOURLY', amount: 30 }],
  currency: 'AZN',
  formats: ['ONLINE'],
  verificationStatus: 'VERIFIED',
  ratingAvg: 4.8,
  ratingCount: 12,
  profileViews: 340,
  isPublished: true,
  subjects: [],
  districts: [],
  languages: [],
  certificates: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('useCertificates (#54)', () => {
  it('uploads then registers a certificate and prepends it to the cached profile', async () => {
    const { client, wrapper } = makeWrapper();
    client.setQueryData(tutorProfileKeys.me(), { ...baseProfile, certificates: [] });
    mockedTicket.mockResolvedValueOnce(ticket);
    mockedUpload.mockResolvedValueOnce(undefined);
    mockedCreate.mockResolvedValueOnce(newCertificate);

    const file = {
      uri: 'file:///tmp/a.pdf',
      name: 'a.pdf',
      contentType: 'application/pdf',
      size: 2048,
    };
    const { result } = await renderHook(() => useCertificates(), { wrapper });
    await result.current.createCertificate({
      title: 'IELTS 8.0',
      issuedBy: 'British Council',
      file,
    });

    expect(mockedTicket).toHaveBeenCalledWith({
      purpose: 'CERTIFICATE',
      contentType: 'application/pdf',
    });
    expect(mockedUpload).toHaveBeenCalledWith(ticket, file);
    expect(mockedCreate).toHaveBeenCalledWith({
      title: 'IELTS 8.0',
      fileUrl: ticket.fileUrl,
      issuedBy: 'British Council',
    });
    await waitFor(() => {
      const cached = client.getQueryData<MyTutorProfile>(tutorProfileKeys.me());
      expect(cached?.certificates).toEqual([newCertificate]);
    });
  });

  it('removes a deleted certificate from the cached profile', async () => {
    const { client, wrapper } = makeWrapper();
    client.setQueryData(tutorProfileKeys.me(), { ...baseProfile, certificates: [existing] });
    mockedDelete.mockResolvedValueOnce(undefined);

    const { result } = await renderHook(() => useCertificates(), { wrapper });
    await result.current.deleteCertificate('c-1');

    expect(mockedDelete).toHaveBeenCalledWith('c-1');
    await waitFor(() => {
      const cached = client.getQueryData<MyTutorProfile>(tutorProfileKeys.me());
      expect(cached?.certificates).toEqual([]);
    });
  });
});
