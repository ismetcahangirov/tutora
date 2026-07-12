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
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { Paginated } from '@common/pagination/page';
import { AdminUsersService } from './admin-users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { AdminUserView } from './users.types';

/** Admin-only user management (#28). Every route requires the ADMIN role. */
@ApiTags('admin: users')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (paginated, filterable)' })
  list(@Query() query: ListUsersQueryDto): Promise<Paginated<AdminUserView>> {
    return this.adminUsers.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Provision a shell user account' })
  create(@Body() dto: AdminCreateUserDto): Promise<AdminUserView> {
    return this.adminUsers.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user' })
  getById(@Param('id') id: string): Promise<AdminUserView> {
    return this.adminUsers.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto): Promise<AdminUserView> {
    return this.adminUsers.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user account' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminUsers.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user account' })
  restore(@Param('id') id: string): Promise<AdminUserView> {
    return this.adminUsers.restore(id);
  }
}
