import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/**
 * Query for the application list endpoints — pagination plus an optional
 * lifecycle-status filter. Shared by the student and tutor inbox views.
 */
export class ListApplicationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus, { message: i18nValidationMessage('validation.common.isEnum') })
  status?: ApplicationStatus;
}
