import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // forwardRef breaks the Users <-> Auth cycle: AuthModule needs UsersService,
  // and UsersModule needs AuthModule's exported guards for @UseGuards.
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, AdminUsersService],
  exports: [UsersService],
})
export class UsersModule {}
