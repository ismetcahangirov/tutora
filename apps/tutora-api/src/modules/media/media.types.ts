/**
 * What a signed upload is for (#37). Drives the storage folder, the allowed
 * content types, and the size limit — see {@link UPLOAD_SPECS}. A plain TS enum
 * (not persisted) validated on the DTO with `@IsEnum`.
 */
export enum MediaPurpose {
  AVATAR = 'AVATAR',
  CERTIFICATE = 'CERTIFICATE',
}

/** How long a signed upload URL stays valid before the client must ask again. */
export const SIGNED_URL_TTL_SECONDS = 15 * 60;

/** Content types accepted for image uploads, mapped to their file extension. */
const IMAGE_CONTENT_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

/** The upload policy for one {@link MediaPurpose}: where, what, and how large. */
export interface UploadSpec {
  /** Top-level object-key folder in the bucket (e.g. `avatars/`). */
  readonly folder: string;
  /** Accepted `Content-Type` → file extension. Anything else is rejected. */
  readonly contentTypes: Readonly<Record<string, string>>;
  /** Hard ceiling on the uploaded object size, enforced by the signed URL. */
  readonly maxBytes: number;
}

/**
 * The upload policy per purpose. Avatars are images only; certificates also
 * accept PDFs. Limits are generous enough for phone photos and scanned docs but
 * bounded so a signed URL can never be used to store arbitrarily large objects.
 */
export const UPLOAD_SPECS: Readonly<Record<MediaPurpose, UploadSpec>> = {
  [MediaPurpose.AVATAR]: {
    folder: 'avatars',
    contentTypes: IMAGE_CONTENT_TYPES,
    maxBytes: 5 * 1024 * 1024,
  },
  [MediaPurpose.CERTIFICATE]: {
    folder: 'certificates',
    contentTypes: { ...IMAGE_CONTENT_TYPES, 'application/pdf': 'pdf' },
    maxBytes: 10 * 1024 * 1024,
  },
};

/**
 * A signed upload ticket returned to the client (#37). The client uploads the
 * file itself with a single `PUT uploadUrl`, sending exactly `headers`, then
 * submits `fileUrl` to the avatar / certificate endpoint. The URL — and the
 * `objectKey` it targets — expire at `expiresAt`.
 */
export interface UploadTicketView {
  /** Pre-signed URL the client PUTs the raw file bytes to. */
  uploadUrl: string;
  /** HTTP method the client must use for the upload. */
  method: 'PUT';
  /** Headers the client must send verbatim (signed into the URL). */
  headers: Record<string, string>;
  /** The object's key within the bucket. */
  objectKey: string;
  /** The canonical URL to store and read the object back from once uploaded. */
  fileUrl: string;
  /** Maximum accepted object size in bytes (also enforced server-side). */
  maxBytes: number;
  /** When the signed upload URL stops being valid. */
  expiresAt: Date;
}
