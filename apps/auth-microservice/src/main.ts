import { NestFactory } from '@nestjs/core';
import { GlobalRpcExceptionFilter } from '@api-contracts/filters/global-rpc-exception.filter';
import appConfig from './shared/config/app.config';
import { ConfigType } from '@nestjs/config';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthModule } from '@auth-microservice/auth.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AuthModule,
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
  console.log(`인증/인가 마이크로서비스가 정상적으로 작동하고 있습니다...`);
}
bootstrap();
