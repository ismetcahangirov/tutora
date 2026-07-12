import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { readFirebaseCredentials, resolveFirebaseApp } from '@common/firebase/firebase-app';

/** Inputs for a single signed upload URL. */
export interface SignedUploadParams {
  /** Object key (path) the client is allowed to write to. */
  objectKey: string;
  /** Exact `Content-Type` the upload must use (signed into the URL). */
  contentType: string;
  /** Upper bound on the object size, enforced via `x-goog-content-length-range`. */
  maxBytes: number;
  /** Absolute moment the signed URL expires. */
  expiresAt: Date;
}

/** Header the client must send so the bucket can enforce the max object size. */
const CONTENT_LENGTH_RANGE_HEADER = 'x-goog-content-length-range';

/**
 * Google Cloud Storage transport for media uploads (#37).
 *
 * Wraps the Firebase Admin SDK (a Firebase Storage bucket *is* a GCS bucket),
 * reusing the same `FIREBASE_*` service account as push (#35) for V4 URL signing
 * — no extra dependency, no network round-trip to sign. When the bucket or the
 * service account is not configured (local dev, tests, CI) the service reports
 * `isConfigured === false` so the API still boots; callers translate that into a
 * clean 503 rather than pretending an upload URL exists.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storage: Storage | null;
  private readonly bucketName: string | null;

  constructor(config: ConfigService) {
    const creds = readFirebaseCredentials(config);
    const bucketName = config.get<string>('FIREBASE_STORAGE_BUCKET')?.trim();

    if (creds && bucketName) {
      this.storage = getStorage(resolveFirebaseApp(creds));
      this.bucketName = bucketName;
    } else {
      this.storage = null;
      this.bucketName = null;
      this.logger.warn('Cloud Storage not configured — media uploads are unavailable.');
    }
  }

  /** Whether a live storage bucket is available (false in dev/test/CI without creds). */
  get isConfigured(): boolean {
    return this.storage !== null && this.bucketName !== null;
  }

  /**
   * Issues a V4 signed URL the client can `PUT` a single object to. The signed
   * URL binds the exact content type and a size range, so the client cannot
   * upload a different type or an oversized file than was authorized.
   */
  async createSignedUploadUrl(params: SignedUploadParams): Promise<string> {
    const { storage, bucketName } = this.requireConfigured();
    const [url] = await storage
      .bucket(bucketName)
      .file(params.objectKey)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: params.expiresAt,
        contentType: params.contentType,
        extensionHeaders: { [CONTENT_LENGTH_RANGE_HEADER]: `0,${params.maxBytes}` },
      });
    return url;
  }

  /** The canonical, stable URL an uploaded object is read back from. */
  publicUrl(objectKey: string): string {
    const { bucketName } = this.requireConfigured();
    const encodedKey = objectKey.split('/').map(encodeURIComponent).join('/');
    return `https://storage.googleapis.com/${bucketName}/${encodedKey}`;
  }

  /** Narrows the nullable fields once, guarding every storage operation. */
  private requireConfigured(): { storage: Storage; bucketName: string } {
    if (!this.storage || !this.bucketName) {
      throw new Error('Cloud Storage is not configured');
    }
    return { storage: this.storage, bucketName: this.bucketName };
  }
}
