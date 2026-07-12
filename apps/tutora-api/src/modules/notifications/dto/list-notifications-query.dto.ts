import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { toBoolean } from '@common/transforms/to-boolean';

/** Query for `GET /api/v1/notifications` — pagination plus an unread-only filter. */
export class ListNotificationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Return only unread notifications.', default: false })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: i18nValidationMessage('validation.common.isBoolean') })
  unreadOnly?: boolean = false;
}
