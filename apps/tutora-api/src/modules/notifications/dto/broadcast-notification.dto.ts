import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { NotificationAudience } from '../notifications.types';

/** Upper bound on a broadcast title. */
export const NOTIFICATION_TITLE_MAX_LENGTH = 120;
/** Upper bound on a broadcast body. */
export const NOTIFICATION_BODY_MAX_LENGTH = 1000;

/**
 * Body of `POST /api/v1/notifications/broadcast` (admin). Sends a notification to
 * an audience segment; the backend fans it out to one in-app record per recipient
 * and pushes to their registered devices.
 */
export class BroadcastNotificationDto {
  @ApiProperty({ enum: NotificationAudience, description: 'Recipient segment.' })
  @IsEnum(NotificationAudience, { message: i18nValidationMessage('validation.common.isEnum') })
  audience!: NotificationAudience;

  @ApiProperty({ maxLength: NOTIFICATION_TITLE_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.common.notEmpty') })
  @MaxLength(NOTIFICATION_TITLE_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  title!: string;

  @ApiProperty({ maxLength: NOTIFICATION_BODY_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.common.notEmpty') })
  @MaxLength(NOTIFICATION_BODY_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  body!: string;

  @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.ANNOUNCEMENT })
  @IsOptional()
  @IsEnum(NotificationType, { message: i18nValidationMessage('validation.common.isEnum') })
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Optional deep-link payload persisted with each record.' })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage('validation.common.isObject') })
  data?: Record<string, unknown>;
}
