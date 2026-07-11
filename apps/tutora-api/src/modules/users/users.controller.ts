import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { UsersService } from './users.service';
import type { UserSummary } from './users.types';

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
}
