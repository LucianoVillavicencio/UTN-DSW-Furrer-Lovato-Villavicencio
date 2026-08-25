import type { ConfigService } from '@nestjs/config';
import { buildTypeOrmConfig } from './typeorm.config';

// Minimal ConfigService stand-in: getOrThrow throws on a missing key, which is
// the behaviour under test.
const configWith = (values: Record<string, string>): ConfigService =>
  ({
    getOrThrow: (key: string) => {
      if (!(key in values)) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return values[key];
    },
  }) as unknown as ConfigService;

const DB_VALUES = {
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'flg_app',
  DB_PASSWORD: 'irrelevant-to-this-test',
  DB_NAME: 'flg',
};

describe('buildTypeOrmConfig', () => {
  it('refuses to build when NODE_ENV is not declared', () => {
    expect(() => buildTypeOrmConfig(configWith(DB_VALUES))).toThrow(/NODE_ENV/);
  });

  it('enables synchronize only in development', () => {
    const config = buildTypeOrmConfig(
      configWith({ ...DB_VALUES, NODE_ENV: 'development' }),
    );
    expect(config).toMatchObject({ synchronize: true });
  });

  it('disables synchronize in production', () => {
    const config = buildTypeOrmConfig(
      configWith({ ...DB_VALUES, NODE_ENV: 'production' }),
    );
    expect(config).toMatchObject({ synchronize: false });
  });

  // The case the old `!== 'production'` test got wrong: any environment that
  // is not literally "production" selected the destructive branch, so staging
  // auto-applied schema changes from whatever entities were built.
  it('disables synchronize in staging', () => {
    const config = buildTypeOrmConfig(
      configWith({ ...DB_VALUES, NODE_ENV: 'staging' }),
    );
    expect(config).toMatchObject({ synchronize: false });
  });

  it('disables synchronize for a typo rather than guessing', () => {
    const config = buildTypeOrmConfig(
      configWith({ ...DB_VALUES, NODE_ENV: 'developement' }),
    );
    expect(config).toMatchObject({ synchronize: false });
  });
});
