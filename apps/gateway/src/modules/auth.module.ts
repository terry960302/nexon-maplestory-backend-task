import jwtConfig from '@api-contracts/config/jwt.config';
import { JwtAuthGuard } from '@gateway/shared/guards/jwt-auth.guard';
import { JwtStrategy } from '@gateway/shared/guards/jwt.strategy';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig), // 명시적으로 추가
    // JwtAuthGuard 에서 전략으로 정의해서 사용
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.secretKey,
        signOptions: { expiresIn: `${config.accessExpiresMins}m` },
      }),
    }),
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AuthModule {}
