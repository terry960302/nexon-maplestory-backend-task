import { Global, Module } from '@nestjs/common';
import {
  ThrottlerModule,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import {
  GatewayErrorCode,
  GatewayErrors,
} from '@gateway/shared/exceptions/gateway-error-code.exception';
import { ConfigModule, ConfigType } from '@nestjs/config';
import rateLimitConfig from '@gateway/shared/config/rate-limit.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(rateLimitConfig),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule.forFeature(rateLimitConfig)],
      inject: [rateLimitConfig.KEY],
      useFactory: (config: ConfigType<typeof rateLimitConfig>) => ({
        // 조건부로 스킵할 때 사용 (선택)
        skipIf: () => false,
        // 특정 UA를 무시하고 싶다면
        ignoreUserAgents: [/HealthCheck/],
        throttlers: [
          {
            limit: config.limit,
            ttl: config.ttl,
          },
        ], // 1분에 같은 클라이언트로부터 60회의 요청만 허용
        errorMessage: (context, limitDetail: ThrottlerLimitDetail) => {
          const req = context.switchToHttp().getRequest();
          console.error(
            `IP ${req.ip}는 분당 ${limitDetail.limit}회를 초과했습니다. 잠시 후 다시 시도해주세요.`,
          );
          return GatewayErrors[GatewayErrorCode.TOO_MANY_REQUESTS].message;
        },
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // 모든 요청에 ThrottlerGuard 적용
    },
  ],
  exports: [],
})
export class RateLimitModule {}
