import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google-issued OIDC ID token obtained on the client.' })
  @IsString({ message: i18nValidationMessage('validation.idToken.notString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.idToken.required') })
  idToken!: string;
}
