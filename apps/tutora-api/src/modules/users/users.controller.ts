import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserSummary> {
    return this.usersService.getSummaryById(user.id);
  }

  /**
   * Completes onboarding for the authenticated user by persisting their chosen
   * role (#23). Only the principal from the token can be updated — the id is
   * never taken from the client — and `UpdateMeDto` rejects non-selectable roles.
   */
  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto): Promise<UserSummary> {
    return this.usersService.completeOnboarding(user.id, dto.role);
  }
}
