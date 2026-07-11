import { appConfig } from '@config/app.config';

describe('appConfig', () => {
  it('exposes the app name (via the @config/* path alias)', () => {
    expect(appConfig.name).toBe('Tutora API');
  });
});
