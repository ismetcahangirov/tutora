/**
 * certificate file transport (#54) — the native modules are mocked. We cover the
 * pure validation guard, the picker→asset mapping (including the missing-mime
 * fallback and cancellation), and the signed binary PUT with its status handling.
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import type { PickedCertificate, UploadTicket } from '@features/tutor-profile/types';

import {
  pickCertificateFile,
  uploadCertificateFile,
  validateCertificateFile,
} from '../certificate-files';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: { BINARY_CONTENT: 0 },
}));

const mockedPicker = DocumentPicker as unknown as { getDocumentAsync: jest.Mock };
const mockedFs = FileSystem as unknown as { uploadAsync: jest.Mock };

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

const file: PickedCertificate = {
  uri: 'file:///tmp/a.pdf',
  name: 'a.pdf',
  contentType: 'application/pdf',
  size: 2048,
};

describe('validateCertificateFile (#54)', () => {
  it('accepts an allowed type within the size limit', () => {
    expect(validateCertificateFile(file)).toBeNull();
  });

  it('rejects an unsupported type', () => {
    expect(validateCertificateFile({ ...file, name: 'a.gif', contentType: 'image/gif' })).toBe(
      'type',
    );
  });

  it('rejects a file over the 10 MB ceiling', () => {
    expect(validateCertificateFile({ ...file, size: 11 * 1024 * 1024 })).toBe('size');
  });

  it('allows a file whose size the picker did not report', () => {
    expect(validateCertificateFile({ ...file, contentType: 'image/png', size: null })).toBeNull();
  });
});

describe('pickCertificateFile (#54)', () => {
  it('maps the first picked asset', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file:///tmp/a.pdf', name: 'a.pdf', mimeType: 'application/pdf', size: 2048 },
      ],
    });

    await expect(pickCertificateFile()).resolves.toEqual(file);
  });

  it('infers the content type from the extension when the picker omits it', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.png', name: 'a.png', size: 2048 }],
    });

    await expect(pickCertificateFile()).resolves.toEqual({
      uri: 'file:///tmp/a.png',
      name: 'a.png',
      contentType: 'image/png',
      size: 2048,
    });
  });

  it('returns null when the tutor cancels', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce({ canceled: true, assets: null });

    await expect(pickCertificateFile()).resolves.toBeNull();
  });
});

describe('uploadCertificateFile (#54)', () => {
  it('PUTs the binary to the signed URL with the ticket headers', async () => {
    mockedFs.uploadAsync.mockResolvedValueOnce({ status: 200, headers: {}, body: '' });

    await uploadCertificateFile(ticket, file);

    expect(mockedFs.uploadAsync).toHaveBeenCalledWith(ticket.uploadUrl, file.uri, {
      httpMethod: 'PUT',
      uploadType: 0,
      headers: ticket.headers,
    });
  });

  it('throws on a non-2xx storage response', async () => {
    mockedFs.uploadAsync.mockResolvedValueOnce({ status: 403, headers: {}, body: 'AccessDenied' });

    await expect(uploadCertificateFile(ticket, file)).rejects.toThrow();
  });
});
