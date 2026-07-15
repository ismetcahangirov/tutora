import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

/**
 * Response shapes for the notifications endpoints. These mirror the projections
 * built in `notifications.mapper.ts` (`NotificationView`, `DeviceView`) and the
 * small result objects returned by `notifications.service.ts` — they exist so
 * Swagger can advertise the response schema, since the TypeScript interfaces are
 * erased at compile time and are invisible to the OpenAPI generator.
 */

/** A user-facing in-app notification, projected for the API. */
export class NotificationViewDto {
  @ApiProperty({ description: 'Notification id.' })
  id!: string;

  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType' })
  type!: NotificationType;

  @ApiProperty({ description: 'Notification title.' })
  title!: string;

  @ApiProperty({ description: 'Notification body.' })
  body!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Optional deep-link payload persisted with the record.',
  })
  data!: Record<string, unknown> | null;

  @ApiProperty({ description: 'Whether the notification has been read.' })
  isRead!: boolean;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'When the notification was read, if it has been.',
  })
  readAt!: string | null;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;
}

/** A registered push target, projected for the API (the raw token is never echoed). */
export class DeviceViewDto {
  @ApiProperty({ description: 'Device registration id.' })
  id!: string;

  @ApiProperty({ description: 'Device platform.' })
  platform!: string;

  @ApiProperty({ format: 'date-time', type: String })
  lastUsedAt!: string;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;
}

/** Result of unregistering a device token. */
export class UnregisterDeviceResultDto {
  @ApiProperty({ description: 'Number of tokens removed (0 or 1).' })
  removed!: number;
}

/** The caller's unread notification count (badge). */
export class UnreadCountResultDto {
  @ApiProperty({ description: 'Number of unread notifications.' })
  count!: number;
}

/** Result of marking all notifications read. */
export class MarkAllReadResultDto {
  @ApiProperty({ description: 'Number of notifications marked read.' })
  readCount!: number;
}

/** Result of a broadcast fan-out. */
export class BroadcastResultDto {
  @ApiProperty({ description: 'Number of recipients the notification was sent to.' })
  recipients!: number;
}
