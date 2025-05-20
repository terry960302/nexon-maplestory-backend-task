import { NestFactory } from '@nestjs/core';
import { EventModule } from '@event-microservice/event.module';
import { GlobalRpcExceptionFilter } from '@api-contracts/filters/global-rpc-exception.filter';
import { ConfigType } from '@nestjs/config';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';
import appConfig from '@event-microservice/shared/configs/app.config';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    EventModule,
    {
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => {
        return {
          transport: Transport.TCP,
          options: {
            host: config.host,
            port: config.port,
          },
        };
      },
    },
  );
  app.useGlobalFilters(new GlobalRpcExceptionFilter());
  await app.listen();
  console.log(`이벤트 마이크로서비스가 정상적으로 작동하고 있습니다...`);
}
bootstrap();
