import type { ConfigService } from '@nestjs/config';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { StorageService } from './storage.service';

jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
  initializeApp: jest.fn(() => ({ name: 'tutora' })),
  cert: jest.fn(() => ({})),
}));
jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(),
}));

const CREDS = {
  FIREBASE_PROJECT_ID: 'proj',
  FIREBASE_CLIENT_EMAIL: 'svc@proj.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN KEY-----\\nabc\\n-----END KEY-----',
};
const CONFIGURED = { ...CREDS, FIREBASE_STORAGE_BUCKET: 'tutora.appspot.com' };

const EXPIRES_AT = new Date('2026-07-12T00:15:00.000Z');

function configFrom(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

/** A fake GCS bucket whose `file().getSignedUrl()` is a controllable jest.fn(). */
function fakeStorage() {
  const getSignedUrl = jest.fn();
  const file = jest.fn(() => ({ getSignedUrl }));
  const bucket = jest.fn(() => ({ file }));
  (getStorage as jest.Mock).mockReturnValue({ bucket });
  return { getSignedUrl, file, bucket };
}

beforeEach(() => {
  jest.clearAllMocks();
  (getApps as jest.Mock).mockReturnValue([]);
  (initializeApp as jest.Mock).mockReturnValue({ name: 'tutora' });
});

describe('StorageService (unconfigured)', () => {
  it('is not configured when the bucket is missing, even with credentials', () => {
    const service = new StorageService(configFrom(CREDS));
    expect(service.isConfigured).toBe(false);
  });

  it('is not configured when credentials are missing, even with a bucket', () => {
    const service = new StorageService(configFrom({ FIREBASE_STORAGE_BUCKET: 'b' }));
    expect(service.isConfigured).toBe(false);
    expect(getStorage).not.toHaveBeenCalled();
  });

  it('throws rather than fabricating a URL when unconfigured', async () => {
    const service = new StorageService(configFrom({}));
    await expect(
      service.createSignedUploadUrl({
        objectKey: 'avatars/u1/a.jpg',
        contentType: 'image/jpeg',
        maxBytes: 100,
        expiresAt: EXPIRES_AT,
      }),
    ).rejects.toThrow('not configured');
    expect(() => service.publicUrl('avatars/u1/a.jpg')).toThrow('not configured');
  });
});

describe('StorageService (configured)', () => {
  it('initializes the shared app once and reports configured', () => {
    fakeStorage();
    const service = new StorageService(configFrom(CONFIGURED));

    expect(service.isConfigured).toBe(true);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it('signs a V4 write URL binding the content type and size range', async () => {
    const storage = fakeStorage();
    storage.getSignedUrl.mockResolvedValueOnce(['https://signed.example/put']);
    const service = new StorageService(configFrom(CONFIGURED));

    const url = await service.createSignedUploadUrl({
      objectKey: 'avatars/u1/a.jpg',
      contentType: 'image/jpeg',
      maxBytes: 5_242_880,
      expiresAt: EXPIRES_AT,
    });

    expect(url).toBe('https://signed.example/put');
    expect(storage.bucket).toHaveBeenCalledWith('tutora.appspot.com');
    expect(storage.file).toHaveBeenCalledWith('avatars/u1/a.jpg');
    expect(storage.getSignedUrl).toHaveBeenCalledWith({
      version: 'v4',
      action: 'write',
      expires: EXPIRES_AT,
      contentType: 'image/jpeg',
      extensionHeaders: { 'x-goog-content-length-range': '0,5242880' },
    });
  });

  it('builds a canonical, percent-encoded public URL', () => {
    fakeStorage();
    const service = new StorageService(configFrom(CONFIGURED));

    expect(service.publicUrl('certificates/u 1/a b.pdf')).toBe(
      'https://storage.googleapis.com/tutora.appspot.com/certificates/u%201/a%20b.pdf',
    );
  });
});
