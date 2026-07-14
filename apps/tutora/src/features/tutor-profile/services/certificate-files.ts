/**
 * Certificate file transport — pick a local file and upload it straight to storage
 * (tutor epic #51, #54; backend #37).
 *
 * Isolated from the API and hooks so the native modules (document picker, file
 * system) sit behind one small, mockable surface — and so the direct-to-storage
 * PUT never goes through the authenticated `apiClient` (it targets an external
 * signed URL and must not carry our bearer token). Validation is a pure function,
 * exported on its own, so an unsupported or oversized file is caught before any
 * network call.
 */
import * as DocumentPicker from 'expo-document-picker';
// The signed PUT needs a raw-binary upload with a custom HTTP method + headers,
// which the legacy file-system API models directly (`uploadAsync`).
import * as FileSystem from 'expo-file-system/legacy';

import { CERTIFICATE_CONTENT_TYPES, CERTIFICATE_MAX_BYTES } from '../constants';
import type { PickedCertificate, UploadTicket } from '../types';

/** Why a picked file was rejected before upload; drives which toast the UI shows. */
export type CertificateFileError = 'type' | 'size';

/** Fallback MIME lookup for when the picker doesn't report one (some Android providers). */
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

function inferContentType(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_CONTENT_TYPES[extension] ?? 'application/octet-stream';
}

/**
 * Opens the system document picker limited to the accepted certificate types.
 * Returns `null` when the tutor cancels, so the caller can simply do nothing.
 */
export async function pickCertificateFile(): Promise<PickedCertificate | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...CERTIFICATE_CONTENT_TYPES],
    copyToCacheDirectory: true,
    multiple: false,
  });

  const asset = result.canceled ? null : result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    name: asset.name,
    contentType: asset.mimeType ?? inferContentType(asset.name),
    size: asset.size ?? null,
  };
}

/** Pure guard mirroring the backend policy: allowed type and within the size ceiling. */
export function validateCertificateFile(file: PickedCertificate): CertificateFileError | null {
  const allowed = (CERTIFICATE_CONTENT_TYPES as readonly string[]).includes(file.contentType);
  if (!allowed) {
    return 'type';
  }
  if (file.size !== null && file.size > CERTIFICATE_MAX_BYTES) {
    return 'size';
  }
  return null;
}

/**
 * Uploads the raw bytes to the signed URL with a single binary PUT, sending exactly
 * the headers the ticket was signed with. Throws on any non-2xx so the caller never
 * registers a certificate whose file didn't actually land.
 */
export async function uploadCertificateFile(
  ticket: UploadTicket,
  file: PickedCertificate,
): Promise<void> {
  const result = await FileSystem.uploadAsync(ticket.uploadUrl, file.uri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: ticket.headers,
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Certificate upload failed with status ${result.status}`);
  }
}
