import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

async function buildController(authService: Partial<AuthService>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [{ provide: AuthService, useValue: authService }],
  }).compile();
  return moduleRef.get(AuthController);
}

describe('AuthController', () => {
  it('delegates POST /auth/google to AuthService', async () => {
    const response = { accessToken: 'acc', refreshToken: 'ref', user: { id: 'u1' } };
    const authService = { authenticateWithGoogle: jest.fn().mockResolvedValue(response) };

    const controller = await buildController(authService);
    const result = await controller.google({ idToken: 'id-token' });

    expect(authService.authenticateWithGoogle).toHaveBeenCalledWith('id-token');
    expect(result).toBe(response);
  });

  it('delegates POST /auth/refresh to AuthService', async () => {
    const pair = { accessToken: 'acc2', refreshToken: 'ref2' };
    const authService = { refresh: jest.fn().mockResolvedValue(pair) };

    const controller = await buildController(authService);
    const result = await controller.refresh({ refreshToken: 'ref' });

    expect(authService.refresh).toHaveBeenCalledWith('ref');
    expect(result).toBe(pair);
  });

  it('delegates POST /auth/logout to AuthService', async () => {
    const authService = { logout: jest.fn().mockResolvedValue(undefined) };

    const controller = await buildController(authService);
    await controller.logout({ refreshToken: 'ref' });

    expect(authService.logout).toHaveBeenCalledWith('ref');
  });
});
