import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'flg',
  autoLoadEntities: true,
  // Never in production: it applies schema changes straight from the entities,
  // with no migration and no review.
  synchronize: process.env.NODE_ENV !== 'production',
};
