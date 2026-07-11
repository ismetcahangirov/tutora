import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RefreshTokenDto } from './refresh-token.dto';

function validate(payload: unknown) {
  return validateSync(plainToInstance(RefreshTokenDto, payload));
}

describe('RefreshTokenDto', () => {
  it('accepts a non-empty refreshToken', () => {
    expect(validate({ refreshToken: 'opaque-token' })).toHaveLength(0);
  });

  it.each([{}, { refreshToken: '' }, { refreshToken: 123 }])(
    'rejects invalid payload %o',
    (payload) => {
      expect(validate(payload).length).toBeGreaterThan(0);
    },
  );
});
