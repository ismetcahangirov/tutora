import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import type { AuthResponse } from './types/auth.types';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleAuthDto): Promise<AuthResponse> {
    return this.authService.authenticateWithGoogle(dto.idToken);
  }
}
