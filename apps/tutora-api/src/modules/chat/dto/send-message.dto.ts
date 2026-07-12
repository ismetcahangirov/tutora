import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Upper bound on a single chat message body. */
export const MESSAGE_MAX_LENGTH = 4000;

/** Body of `POST /api/v1/chat/threads/:id/messages`. */
export class SendMessageDto {
  @ApiProperty({ maxLength: MESSAGE_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.common.notEmpty') })
  @MaxLength(MESSAGE_MAX_LENGTH, { message: i18nValidationMessage('validation.common.maxLength') })
  body!: string;
}
