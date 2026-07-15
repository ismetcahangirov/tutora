import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import type { Paginated } from '@common/pagination/page';
import { ApiPaginatedResponse, ApiStandardErrorResponses } from '@common/swagger';
import { AdminReviewsService } from './admin-reviews.service';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { AdminReviewViewDto } from './dto/review-response.dto';
import type { AdminReviewView } from './reviews.types';

/** Admin-only review moderation (#33). */
@ApiTags('admin: reviews')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/reviews', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminReviewsController {
  constructor(private readonly adminReviews: AdminReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews (paginated, filterable)' })
  @ApiPaginatedResponse(AdminReviewViewDto)
  @ApiStandardErrorResponses('badRequest')
  list(@Query() query: ListReviewsQueryDto): Promise<Paginated<AdminReviewView>> {
    return this.adminReviews.list(query);
  }

  @Patch(':id/moderate')
  @ApiOperation({ summary: 'Set a review’s visibility (publish / hide / remove)' })
  @ApiParam({ name: 'id', description: 'Review id.' })
  @ApiOkResponse({ description: 'The moderated review.', type: AdminReviewViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  moderate(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<AdminReviewView> {
    return this.adminReviews.moderate(id, dto, admin.id);
  }
}
