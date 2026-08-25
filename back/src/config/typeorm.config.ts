import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmConfig(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.getOrThrow<string>('DB_PORT')),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_NAME'),
    autoLoadEntities: true,
    // Applies schema changes straight from the entities, with no migration and
    // no review. Opt-in by name rather than opt-out: the old test was
    // `NODE_ENV !== 'production'`, which selected this branch for an unset,
    // empty or misspelled value — and nothing in this repository ever set the
    // variable, so it was always on. See FLG-SEC-10.
    synchronize: config.getOrThrow<string>('NODE_ENV') === 'development',
  };
}
