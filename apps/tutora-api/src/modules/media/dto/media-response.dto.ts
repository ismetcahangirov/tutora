import { ApiProperty } from '@nestjs/swagger';

/**
 * Response shape for the media endpoints. This mirrors `UploadTicketView` in
 * `media.types.ts` — it exists so Swagger can advertise the response schema,
 * since the TypeScript interface is erased at compile time and is invisible to
 * the OpenAPI generator.
 */

/**
 * A signed upload ticket returned to the client (#37). The client PUTs the raw
 * file bytes to `uploadUrl` sending exactly `headers`, then submits `fileUrl` to
 * the downstream avatar / certificate endpoint. The URL expires at `expiresAt`.
 */
export class UploadTicketViewDto {
  @ApiProperty({ description: 'Pre-signed URL the client PUTs the raw file bytes to.' })
  uploadUrl!: string;

  @ApiProperty({ enum: ['PUT'], description: 'HTTP method the client must use for the upload.' })
  method!: 'PUT';

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Headers the client must send verbatim (signed into the URL).',
  })
  headers!: Record<string, string>;

  @ApiProperty({ description: "The object's key within the bucket." })
  objectKey!: string;

  @ApiProperty({
    description: 'Canonical URL to store and read the object back from once uploaded.',
  })
  fileUrl!: string;

  @ApiProperty({ description: 'Maximum accepted object size in bytes.' })
  maxBytes!: number;

  @ApiProperty({
    format: 'date-time',
    type: String,
    description: 'When the signed upload URL stops being valid.',
  })
  expiresAt!: string;
}
