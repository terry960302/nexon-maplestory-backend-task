// apps/service-auth/src/modules/auth/auth.module.ts
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '@api-contracts/config/jwt.config';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AuthService } from '@auth-microservice/application/auth.service';
import { AuthController } from '@auth-microservice/presentation/auth.controller';
import { UserRepository } from '@auth-microservice/infrastructure/repositories/user.repository';
import { RefreshTokensRepository } from '@auth-microservice/infrastructure/repositories/refresh-token.repository';
import appConfig from './shared/config/app.config';
import { join } from 'path';
import { validationSchema } from './shared/config/validation.schema';
import { DatabaseModule } from './shared/database/database.module';
import dbConfig from './shared/config/db.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, jwtConfig],
      envFilePath: [
        join(
          __dirname,
          '..',
          '..',
          '..',
          'env',
          process.env.NODE_ENV ?? 'dev',
          '.env.common',
        ),
        join(
          __dirname,
          '..',
          '..',
          '..',
          'env',
          process.env.NODE_ENV ?? 'dev',
          '.env.auth',
        ),
      ],
      validationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),
    DatabaseModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.secretKey,
        signOptions: { expiresIn: `${config.accessExpiresMins}m` },
      }),
    }),
  ],
  providers: [AuthService, UserRepository, RefreshTokensRepository],
  controllers: [AuthController],
})
export class AuthModule {}
