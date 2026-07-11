import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '@modules/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleVerifierService } from './services/google-verifier.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [forwardRef(() => UsersModule), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, GoogleVerifierService, TokenService, JwtAuthGuard, RolesGuard],
  // Export the guards (and JwtModule for JwtService) so feature modules can
  // protect their own routes without re-wiring JWT verification.
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
