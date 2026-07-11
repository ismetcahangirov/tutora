import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { AuthService } from './auth.service';
import { GoogleVerifierService } from './services/google-verifier.service';
import { TokenService } from './services/token.service';

const profile = { googleId: 'g1', email: 'ada@example.com', emailVerified: true, name: 'Ada' };
const user = {
  id: 'u1',
  email: 'ada@example.com',
  name: 'Ada',
  avatarUrl: null,
  role: null,
  onboardingCompleted: false,
};

function build() {
  const verifier = { verify: jest.fn().mockResolvedValue(profile) };
  const users = { upsertFromGoogle: jest.fn().mockResolvedValue(user) };
  const tokens = {
    issueTokens: jest.fn().mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' }),
  };
  const service = new AuthService(
    verifier as unknown as GoogleVerifierService,
    users as unknown as UsersService,
    tokens as unknown as TokenService,
  );
  return { service, verifier, users, tokens };
}

describe('AuthService.authenticateWithGoogle', () => {
  it('verifies, provisions, issues, and shapes the response', async () => {
    const { service, verifier, users, tokens } = build();

    const result = await service.authenticateWithGoogle('id-token');

    expect(verifier.verify).toHaveBeenCalledWith('id-token');
    expect(users.upsertFromGoogle).toHaveBeenCalledWith(profile);
    expect(tokens.issueTokens).toHaveBeenCalledWith(user);
    expect(result).toEqual({
      accessToken: 'acc',
      refreshToken: 'ref',
      user: {
        id: 'u1',
        email: 'ada@example.com',
        name: 'Ada',
        avatarUrl: null,
        role: null,
        onboardingCompleted: false,
      },
    });
  });

  it('propagates a verification failure and never provisions', async () => {
    const { service, verifier, users } = build();
    verifier.verify.mockRejectedValueOnce(new UnauthorizedException());

    await expect(service.authenticateWithGoogle('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(users.upsertFromGoogle).not.toHaveBeenCalled();
  });
});
