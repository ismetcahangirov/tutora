import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { GoogleVerifierService } from './google-verifier.service';

jest.mock('google-auth-library');

const MockedOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;

function verifyIdTokenReturning(payload: Record<string, unknown> | undefined) {
  MockedOAuth2Client.prototype.verifyIdToken = jest
    .fn()
    .mockResolvedValue({ getPayload: () => payload });
}

function buildService(): GoogleVerifierService {
  const config = { getOrThrow: jest.fn().mockReturnValue('client-id') } as unknown as ConfigService;
  return new GoogleVerifierService(config);
}

describe('GoogleVerifierService.verify', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a normalized profile for a valid token', async () => {
    verifyIdTokenReturning({
      sub: 'google-sub-1',
      email: 'ada@example.com',
      email_verified: true,
      name: 'Ada',
      picture: 'https://img/a.png',
      locale: 'en',
    });

    const profile = await buildService().verify('good-token');

    expect(profile).toEqual({
      googleId: 'google-sub-1',
      email: 'ada@example.com',
      emailVerified: true,
      name: 'Ada',
      picture: 'https://img/a.png',
      locale: 'en',
    });
  });

  it('throws Unauthorized when the library rejects the token', async () => {
    MockedOAuth2Client.prototype.verifyIdToken = jest.fn().mockRejectedValue(new Error('bad'));
    await expect(buildService().verify('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws Unauthorized when email is not verified', async () => {
    verifyIdTokenReturning({ sub: 's', email: 'x@example.com', email_verified: false });
    await expect(buildService().verify('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
