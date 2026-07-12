import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PROVIDER_REF_MAX_LENGTH } from './subscribe.dto';

/**
 * Body of `PATCH /api/v1/admin/payments/:id/status`. Reconciles a payment with
 * the gateway — only legal lifecycle transitions are accepted (see
 * `canTransitionPayment`), and the linked subscription follows.
 */
export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status!: PaymentStatus;

  @ApiPropertyOptional({ description: 'Provider-side reference recorded with the settlement.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.common.isString') })
  @MaxLength(PROVIDER_REF_MAX_LENGTH, {
    message: i18nValidationMessage('validation.common.maxLength'),
  })
  providerRef?: string;
}
