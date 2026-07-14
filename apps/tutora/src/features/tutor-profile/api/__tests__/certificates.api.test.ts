/**
 * certificates API (#54) — the shared client is mocked; we assert each call hits
 * the right endpoint with the right verb + body, and returns the typed value the
 * cache is written from.
 */
import { apiClient } from '@/shared/lib';
import { MEDIA_ENDPOINTS, TUTOR_PROFILE_ENDPOINTS } from '@features/tutor-profile/constants';
import type { TutorCertificate, UploadTicket } from '@features/tutor-profile/types';

import { createCertificate, createUploadTicket, deleteCertificate } from '../certificates.api';

jest.mock('@/shared/lib', () => ({
  apiClient: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mocked = apiClient as unknown as {
  post: jest.Mock;
  delete: jest.Mock;
};

const ticket: UploadTicket = {
  uploadUrl: 'https://storage.example/put',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/pdf',
    'x-goog-content-length-range': '0,10485760',
  },
  objectKey: 'certificates/u-1/abc.pdf',
  fileUrl: 'https://storage.example/certificates/u-1/abc.pdf',
  maxBytes: 10_485_760,
  expiresAt: '2026-01-01T00:15:00.000Z',
};

const certificate: TutorCertificate = {
  id: 'c-1',
  title: 'IELTS 8.0',
  fileUrl: ticket.fileUrl,
  status: 'PENDING',
  issuedBy: 'British Council',
  reviewedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('certificates API (#54)', () => {
  it('requests a signed certificate upload ticket', async () => {
    mocked.post.mockResolvedValueOnce({ data: ticket });

    await expect(
      createUploadTicket({ purpose: 'CERTIFICATE', contentType: 'application/pdf' }),
    ).resolves.toEqual(ticket);
    expect(mocked.post).toHaveBeenCalledWith(MEDIA_ENDPOINTS.uploads, {
      purpose: 'CERTIFICATE',
      contentType: 'application/pdf',
    });
  });

  it('registers an uploaded certificate', async () => {
    mocked.post.mockResolvedValueOnce({ data: certificate });

    await expect(
      createCertificate({
        title: 'IELTS 8.0',
        fileUrl: ticket.fileUrl,
        issuedBy: 'British Council',
      }),
    ).resolves.toEqual(certificate);
    expect(mocked.post).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.certificates, {
      title: 'IELTS 8.0',
      fileUrl: ticket.fileUrl,
      issuedBy: 'British Council',
    });
  });

  it('deletes a certificate by id', async () => {
    mocked.delete.mockResolvedValueOnce({ data: undefined });

    await deleteCertificate('c-1');

    expect(mocked.delete).toHaveBeenCalledWith(TUTOR_PROFILE_ENDPOINTS.certificateById('c-1'));
  });
});
