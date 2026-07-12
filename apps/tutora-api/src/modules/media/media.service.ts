import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { StorageService } from './storage.service';
import { SIGNED_URL_TTL_SECONDS, UPLOAD_SPECS, type UploadTicketView } from './media.types';
import type { CreateUploadDto } from './dto/create-upload.dto';

/**
 * Issues signed upload tickets for avatars and certificates (#37).
 *
 * The service never receives file bytes: it validates the request against the
 * per-purpose policy ({@link UPLOAD_SPECS}), mints a unique object key namespaced
 * to the caller, and hands back a short-lived signed `PUT` URL. The client uploads
 * directly to Cloud Storage and then submits the returned `fileUrl` to the avatar
 * or certificate endpoint — keeping large transfers off the API entirely.
 */
@Injectable()
export class MediaService {
  constructor(private readonly storage: StorageService) {}

  /** Validates the request and returns a signed upload ticket for the caller. */
  async createUpload(user: AuthenticatedUser, dto: CreateUploadDto): Promise<UploadTicketView> {
    const spec = UPLOAD_SPECS[dto.purpose];
    const extension = spec.contentTypes[dto.contentType];
    if (!extension) {
      throw new BadRequestException(
        `Content type "${dto.contentType}" is not allowed for a ${dto.purpose.toLowerCase()} upload`,
      );
    }

    // Honest degradation: without storage credentials there is no real URL to
    // hand out, so surface a 503 instead of a fabricated one (unit-tested).
    if (!this.storage.isConfigured) {
      throw new ServiceUnavailableException('Media uploads are not available');
    }

    // Key is namespaced by user so one caller can never obtain a write URL into
    // another's space; the random suffix avoids collisions and guessable paths.
    const objectKey = `${spec.folder}/${user.id}/${randomUUID()}.${extension}`;
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000);

    const uploadUrl = await this.storage.createSignedUploadUrl({
      objectKey,
      contentType: dto.contentType,
      maxBytes: spec.maxBytes,
      expiresAt,
    });

    return {
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': dto.contentType,
        'x-goog-content-length-range': `0,${spec.maxBytes}`,
      },
      objectKey,
      fileUrl: this.storage.publicUrl(objectKey),
      maxBytes: spec.maxBytes,
      expiresAt,
    };
  }
}
