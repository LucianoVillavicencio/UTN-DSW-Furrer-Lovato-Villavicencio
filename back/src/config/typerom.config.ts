import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'flg',
  autoLoadEntities: true,
  // Nunca en producción: aplica cambios de schema automáticamente a partir
  // de las entities, sin migraciones ni revisión.
  synchronize: process.env.NODE_ENV !== 'production',
};
