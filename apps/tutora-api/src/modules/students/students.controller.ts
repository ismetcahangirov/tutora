import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
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
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentsService } from './students.service';
import type { FavoriteTutorView, StudentProfileView } from './students.types';

/** A student managing their own profile, preferences and favorites (#30). */
@ApiTags('students')
@ApiBearerAuth('bearer')
@Controller({ path: 'students', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated student profile' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<StudentProfileView> {
    return this.students.getOwnProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated student profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStudentProfileDto,
  ): Promise<StudentProfileView> {
    return this.students.updateOwnProfile(user.id, dto);
  }

  @Get('me/favorites')
  @ApiOperation({ summary: 'List favorited tutors (paginated)' })
  listFavorites(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<FavoriteTutorView>> {
    return this.students.listFavorites(user.id, query);
  }

  @Put('me/favorites/:tutorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Favorite a tutor (idempotent)' })
  async addFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tutorId') tutorId: string,
  ): Promise<void> {
    await this.students.addFavorite(user.id, tutorId);
  }

  @Delete('me/favorites/:tutorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a favorited tutor (idempotent)' })
  async removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tutorId') tutorId: string,
  ): Promise<void> {
    await this.students.removeFavorite(user.id, tutorId);
  }
}
