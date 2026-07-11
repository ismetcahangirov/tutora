import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  it('delegates POST /auth/google to AuthService', async () => {
    const response = { accessToken: 'acc', refreshToken: 'ref', user: { id: 'u1' } };
    const authService = { authenticateWithGoogle: jest.fn().mockResolvedValue(response) };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    const controller = moduleRef.get(AuthController);
    const result = await controller.google({ idToken: 'id-token' });

    expect(authService.authenticateWithGoogle).toHaveBeenCalledWith('id-token');
    expect(result).toBe(response);
  });
});
