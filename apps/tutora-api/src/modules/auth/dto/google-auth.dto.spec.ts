import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { GoogleAuthDto } from './google-auth.dto';

function validate(payload: unknown) {
  return validateSync(plainToInstance(GoogleAuthDto, payload));
}

describe('GoogleAuthDto', () => {
  it('accepts a non-empty idToken', () => {
    expect(validate({ idToken: 'abc.def.ghi' })).toHaveLength(0);
  });

  it.each([{}, { idToken: '' }, { idToken: 123 }])('rejects invalid payload %o', (payload) => {
    expect(validate(payload).length).toBeGreaterThan(0);
  });
});
