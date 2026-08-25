import { ConfigService } from '@nestjs/config';
import { buildTypeOrmConfig } from './typeorm.config';

describe('buildTypeOrmConfig', () => {
  const complete = {
    DB_HOST: 'db.internal',
    DB_PORT: '3306',
    DB_USER: 'flg_app',
    DB_PASSWORD: 's3cret',
    DB_NAME: 'flg',
  };

  it('builds the config when every DB_* variable is set', () => {
    const config = new ConfigService(complete);
    expect(() => buildTypeOrmConfig(config)).not.toThrow();
  });

  it.each(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'])(
    'refuses to boot when %s is missing',
    (missing) => {
      const partial = { ...complete, [missing]: undefined };
      const config = new ConfigService(partial);
      expect(() => buildTypeOrmConfig(config)).toThrow();
    },
  );
});
