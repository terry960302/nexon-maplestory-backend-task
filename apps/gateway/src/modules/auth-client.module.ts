import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthClientController } from '@gateway/presentation/auth-client.controller';
import { SERVICE_AUTH } from '@gateway/shared/constants/service-names';
import microserviceConfig from '@gateway/shared/config/microservice.config';
import { ConfigModule, ConfigType } from '@nestjs/config';

@Module({
  imports: [
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
    ]),
  ],
  controllers: [AuthClientController],
})
export class AuthClientModule {}
