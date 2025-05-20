// src/auth/strategies/jwt.strategy.ts
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import { JwtPayload } from 'jsonwebtoken';
import jwtConfig from '@api-contracts/config/jwt.config';
import { AuthenticatedUserDetails } from '@gateway/shared/interfaces/authenticated-user-details.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private config: ConfigType<typeof jwtConfig>,
  ) {
    super(<StrategyOptions>{
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.secretKey,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUserDetails> {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
