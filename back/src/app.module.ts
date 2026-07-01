import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typerom.config';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';

@Module({
  imports:  [ConfigModule.forRoot({isGlobal : true}),
  TypeOrmModule.forRoot(typeOrmConfig),
  UserModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
