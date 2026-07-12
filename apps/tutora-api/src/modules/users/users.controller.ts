import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';
import type { UserSummary } from './users.types';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns the authenticated user's own profile summary. The principal is
   * resolved from the verified access token by `JwtAuthGuard`.
   */
  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserSummary> {
    return this.usersService.getSummaryById(user.id);
  }

  /**
   * Updates the authenticated user's own profile. Serves onboarding (send
   * `role`) and ordinary edits (name, avatar, locale). Only the principal from
   * the token can be updated — the id is never taken from the client.
   */
  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto): Promise<UserSummary> {
    return this.usersService.updateMe(user.id, dto);
  }

  /**
   * Soft-deletes the authenticated user's own account and revokes their refresh
   * tokens (account lifecycle, #28). Idempotent from the client's perspective.
   */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate (soft-delete) the authenticated account' })
  async deleteMe(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.usersService.deactivateAccount(user.id);
  }
}
