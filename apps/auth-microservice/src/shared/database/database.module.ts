import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigType } from '@nestjs/config';
import dbConfig from '@auth-microservice/shared/config/db.config';
import {
  RefreshToken,
  RefreshTokenSchema,
} from '@auth-microservice/infrastructure/schemas/refresh-token.schema';
import {
  User,
  UserSchema,
} from '@auth-microservice/infrastructure/schemas/user.schema';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(dbConfig),
    // 데이터베이스 연결
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [dbConfig.KEY],
      useFactory: (config: ConfigType<typeof dbConfig>) => ({
        uri: config.uri,
        dbName: config.dbName,
        autoIndex: true,
        autoCreate: true,
      }),
    }),
    // 스키마 적용
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
