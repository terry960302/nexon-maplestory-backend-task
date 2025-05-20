import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from '@gateway/gateway.module';
import { ConfigType } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { RpcToHttpExceptionFilter } from './shared/filters/rpc-to-http-exception.filter';
import { RpcTimeoutInterceptor } from './shared/interceptors/rpc-timeout.interceptor';
import appConfig from './shared/config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, {
    logger: ['error', 'warn'],
  });
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const port = config.port;

  console.log(
    'Auth Service:',
    process.env.SERVICE_AUTH_HOST,
    process.env.SERVICE_AUTH_PORT,
  );
  console.log(
    'Event Service:',
    process.env.SERVICE_EVENT_HOST,
    process.env.SERVICE_EVENT_PORT,
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new RpcToHttpExceptionFilter());
  app.useGlobalInterceptors(new RpcTimeoutInterceptor());
  await app.listen(port);
  console.log(`API Gateway 가 ${port} 에서 정상적으로 작동하고 있습니다...`);
}
bootstrap();
