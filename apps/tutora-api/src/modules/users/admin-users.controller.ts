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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { Paginated } from '@common/pagination/page';
import { ApiPaginatedResponse, ApiStandardErrorResponses } from '@common/swagger';
import { AdminUsersService } from './admin-users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AdminUserViewDto } from './dto/user-response.dto';
import type { AdminUserView } from './users.types';

/** Admin-only user management (#28). Every route requires the ADMIN role. */
@ApiTags('admin: users')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (paginated, filterable)' })
  @ApiPaginatedResponse(AdminUserViewDto)
  @ApiStandardErrorResponses('badRequest')
  list(@Query() query: ListUsersQueryDto): Promise<Paginated<AdminUserView>> {
    return this.adminUsers.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Provision a shell user account' })
  @ApiCreatedResponse({ description: 'The provisioned user.', type: AdminUserViewDto })
  @ApiStandardErrorResponses('badRequest', 'conflict')
  create(@Body() dto: AdminCreateUserDto): Promise<AdminUserView> {
    return this.adminUsers.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user' })
  @ApiParam({ name: 'id', description: 'User id.' })
  @ApiOkResponse({ description: 'The requested user.', type: AdminUserViewDto })
  @ApiStandardErrorResponses('notFound')
  getById(@Param('id') id: string): Promise<AdminUserView> {
    return this.adminUsers.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User id.' })
  @ApiOkResponse({ description: 'The updated user.', type: AdminUserViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto): Promise<AdminUserView> {
    return this.adminUsers.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user account' })
  @ApiParam({ name: 'id', description: 'User id.' })
  @ApiNoContentResponse({ description: 'The user was soft-deleted.' })
  @ApiStandardErrorResponses('notFound')
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminUsers.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user account' })
  @ApiParam({ name: 'id', description: 'User id.' })
  @ApiOkResponse({ description: 'The restored user.', type: AdminUserViewDto })
  @ApiStandardErrorResponses('notFound')
  restore(@Param('id') id: string): Promise<AdminUserView> {
    return this.adminUsers.restore(id);
  }
}
