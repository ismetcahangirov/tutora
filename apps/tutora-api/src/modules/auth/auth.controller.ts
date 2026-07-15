import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiStandardErrorResponses } from '@common/swagger';
import { AUTH_THROTTLE, DEFAULT_THROTTLER } from '@common/throttler/throttle.constants';
import { AuthService } from './auth.service';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
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
  @ApiOperation({ summary: 'Sign in with a Google ID token' })
  @ApiOkResponse({ description: 'The issued token pair and user summary.', type: AuthResponseDto })
  @ApiStandardErrorResponses('badRequest', 'unauthorized', 'tooManyRequests')
  async google(@Body() dto: GoogleAuthDto): Promise<AuthResponse> {
    return this.authService.authenticateWithGoogle(dto.idToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ApiOkResponse({ description: 'The rotated token pair.', type: AuthTokensDto })
  @ApiStandardErrorResponses('badRequest', 'unauthorized', 'tooManyRequests')
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a refresh token (sign out)' })
  @ApiNoContentResponse({ description: 'The refresh token was revoked.' })
  @ApiStandardErrorResponses('badRequest', 'tooManyRequests')
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }
}
