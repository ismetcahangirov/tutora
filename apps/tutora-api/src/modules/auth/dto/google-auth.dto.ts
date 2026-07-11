import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GoogleAuthDto {
  @IsString({ message: i18nValidationMessage('validation.idToken.notString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.idToken.required') })
  idToken!: string;
}
