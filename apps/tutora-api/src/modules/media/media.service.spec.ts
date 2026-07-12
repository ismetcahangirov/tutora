import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { MediaService } from './media.service';
import { MediaPurpose } from './media.types';
import type { StorageService } from './storage.service';

const USER: AuthenticatedUser = {
  id: 'u1',
  email: 'bob@example.com',
  role: null,
  onboardingCompleted: true,
};

function fakeStorage(isConfigured = true): {
  storage: StorageService;
  createSignedUploadUrl: jest.Mock;
  publicUrl: jest.Mock;
} {
  const createSignedUploadUrl = jest.fn().mockResolvedValue('https://signed.example/put');
  const publicUrl = jest.fn((key: string) => `https://storage.example/${key}`);
  const storage = { isConfigured, createSignedUploadUrl, publicUrl } as unknown as StorageService;
  return { storage, createSignedUploadUrl, publicUrl };
}

describe('MediaService', () => {
  it('mints an avatar ticket: namespaced key, image limit, signed headers', async () => {
    const { storage, createSignedUploadUrl, publicUrl } = fakeStorage();
    const service = new MediaService(storage);

    const ticket = await service.createUpload(USER, {
      purpose: MediaPurpose.AVATAR,
      contentType: 'image/png',
    });

    expect(ticket.objectKey).toMatch(
      /^avatars\/u1\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
    expect(ticket.method).toBe('PUT');
    expect(ticket.maxBytes).toBe(5 * 1024 * 1024);
    expect(ticket.headers).toEqual({
      'Content-Type': 'image/png',
      'x-goog-content-length-range': `0,${5 * 1024 * 1024}`,
    });
    expect(ticket.uploadUrl).toBe('https://signed.example/put');
    expect(ticket.fileUrl).toBe(`https://storage.example/${ticket.objectKey}`);
    expect(ticket.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(createSignedUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        objectKey: ticket.objectKey,
        contentType: 'image/png',
        maxBytes: 5 * 1024 * 1024,
      }),
    );
    expect(publicUrl).toHaveBeenCalledWith(ticket.objectKey);
  });

  it('mints a certificate ticket for a PDF with the larger limit', async () => {
    const { storage } = fakeStorage();
    const service = new MediaService(storage);

    const ticket = await service.createUpload(USER, {
      purpose: MediaPurpose.CERTIFICATE,
      contentType: 'application/pdf',
    });

    expect(ticket.objectKey).toMatch(/^certificates\/u1\/.+\.pdf$/);
    expect(ticket.maxBytes).toBe(10 * 1024 * 1024);
  });

  it('rejects a content type not allowed for the purpose (PDF avatar)', async () => {
    const { storage, createSignedUploadUrl } = fakeStorage();
    const service = new MediaService(storage);

    await expect(
      service.createUpload(USER, {
        purpose: MediaPurpose.AVATAR,
        contentType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('rejects an unknown content type', async () => {
    const { storage } = fakeStorage();
    const service = new MediaService(storage);

    await expect(
      service.createUpload(USER, {
        purpose: MediaPurpose.AVATAR,
        contentType: 'image/gif',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 503 (without signing) when storage is not configured', async () => {
    const { storage, createSignedUploadUrl } = fakeStorage(false);
    const service = new MediaService(storage);

    await expect(
      service.createUpload(USER, {
        purpose: MediaPurpose.AVATAR,
        contentType: 'image/jpeg',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('namespaces the object key to the requesting user', async () => {
    const { storage } = fakeStorage();
    const service = new MediaService(storage);

    const ticket = await service.createUpload(
      { ...USER, id: 'someone-else' },
      { purpose: MediaPurpose.AVATAR, contentType: 'image/jpeg' },
    );

    expect(ticket.objectKey.startsWith('avatars/someone-else/')).toBe(true);
  });
});
