import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICE_EVENT } from '@gateway/shared/constants/service-names';
import { EventClientController } from '../presentation/event-client.controller';
import { RewardClientController } from '../presentation/reward-client.controller';
import { RewardRequestClientController } from '../presentation/reward-request-client.controller';
import { ConfigModule, ConfigType } from '@nestjs/config';
import microserviceConfig from '@gateway/shared/config/microservice.config';

@Module({
  imports: [
    ClientsModule.registerAsync([
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
  ],
  controllers: [
    EventClientController,
    RewardClientController,
    RewardRequestClientController,
  ],
})
export class EventClientModule {}
