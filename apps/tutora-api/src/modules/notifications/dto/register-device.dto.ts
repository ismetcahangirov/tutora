import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Generous upper bound on an FCM registration token. */
export const DEVICE_TOKEN_MAX_LENGTH = 4096;

/** Body of `POST /api/v1/notifications/devices` — registers a push target. */
export class RegisterDeviceDto {
  @ApiProperty({ maxLength: DEVICE_TOKEN_MAX_LENGTH, description: 'FCM registration token.' })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.common.notEmpty') })
  @MaxLength(DEVICE_TOKEN_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  token!: string;

  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform, { message: i18nValidationMessage('validation.common.isEnum') })
  platform!: DevicePlatform;
}
