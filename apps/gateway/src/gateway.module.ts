import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  SERVICE_AUTH,
  SERVICE_EVENT,
} from '@gateway/shared/constants/service-names';
import { RateLimitModule } from '@gateway/modules/rate-limit.module';
import { AuthClientModule } from '@gateway/modules/auth-client.module';
import { EventClientModule } from '@gateway/modules/event-client.module';
import { AuthModule } from '@gateway/modules/auth.module';
import appConfig from '@gateway/shared/config/app.config';
import microserviceConfig from '@gateway/shared/config/microservice.config';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(
          __dirname,
          '..',
          '..',
          '..',
          'env',
          process.env.NODE_ENV,
          '.env.common',
        ),
        join(
          __dirname,
          '..',
          '..',
          '..',
          'env',
          process.env.NODE_ENV,
          '.env.gateway',
        ),
      ],
    }),
    ConfigModule.forFeature(appConfig),
    ClientsModule.registerAsync([
      {
        name: SERVICE_AUTH,
        inject: [microserviceConfig.KEY],
        imports: [ConfigModule.forFeature(microserviceConfig)],
        useFactory: (config: ConfigType<typeof microserviceConfig>) => ({
          transport: Transport.TCP,
          options: {
            host: config.authMicroservice.host,
            port: config.authMicroservice.port,
            retryAttempts: config.retryAttempts, // 재시도 횟수
            retryDelay: config.retryDelay, // 재시도 간격(ms)
          },
        }),
      },
      {
        name: SERVICE_EVENT,
        inject: [microserviceConfig.KEY],
        imports: [ConfigModule.forFeature(microserviceConfig)],
        useFactory: (config: ConfigType<typeof microserviceConfig>) => ({
          transport: Transport.TCP,
          host: config.eventMicroservice.host,
          port: config.eventMicroservice.port,
          retryAttempts: config.retryAttempts, // 재시도 횟수
          retryDelay: config.retryDelay, // 재시도 간격(ms)
        }),
      },
    ]),
    AuthModule,
    RateLimitModule,
    AuthClientModule,
    EventClientModule,
  ],
})
export class GatewayModule {}
