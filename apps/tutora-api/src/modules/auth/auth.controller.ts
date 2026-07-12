import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AUTH_THROTTLE, DEFAULT_THROTTLER } from '@common/throttler/throttle.constants';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { AuthResponse, AuthTokens } from './types/auth.types';

// Tighter budget than the global default: these unauthenticated endpoints are the
// prime target for credential stuffing and refresh-token brute force.
@Throttle({ [DEFAULT_THROTTLER]: { limit: AUTH_THROTTLE.limit, ttl: AUTH_THROTTLE.ttl } })
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleAuthDto): Promise<AuthResponse> {
    return this.authService.authenticateWithGoogle(dto.idToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }
}
