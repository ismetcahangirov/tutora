import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import type { Paginated } from '@common/pagination/page';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';
import type { ReviewView } from './reviews.types';

/** A student authoring reviews for tutors they completed a session with (#33). */
@ApiTags('reviews')
@ApiBearerAuth('bearer')
@Controller({ path: 'reviews', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Review a completed session' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewView> {
    return this.reviews.create(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List the student’s own reviews (paginated)' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<ReviewView>> {
    return this.reviews.listForStudent(user.id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit one of the student’s own reviews' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewView> {
    return this.reviews.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete one of the student’s own reviews' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.reviews.remove(user.id, id);
  }
}
