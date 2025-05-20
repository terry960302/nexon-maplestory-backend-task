import { LoginRequestDto } from '@api-contracts/dto/auth/login-request.dto';
import { SignUpRequestDto } from '@api-contracts/dto/auth/signup-request.dto';
import { SignUpResponseDto } from '@api-contracts/dto/auth/signup-response.dto';
import { RefreshTokensRepository } from '@auth-microservice/infrastructure/repositories/refresh-token.repository';
import { UserRepository } from '@auth-microservice/infrastructure/repositories/user.repository';
import {
  User,
  UserDocument,
} from '@auth-microservice/infrastructure/schemas/user.schema';
import {
  AuthErrorCode,
  AuthErrors,
} from '@auth-microservice/shared/exceptions/auth-error-code.enum';
import { AuthException } from '@auth-microservice/shared/exceptions/auth.exception';
import { PasswordUtil } from '@auth-microservice/shared/utils/password.util';
import { randomTokenString } from '@auth-microservice/shared/utils/token.util';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '@api-contracts/config/jwt.config';
import { JwtPayload } from 'jsonwebtoken';
import { LoginResponseDto } from '@api-contracts/dto/auth/login-response.dto';
import { RefreshTokenResponseDto } from '@api-contracts/dto/auth/refresh-token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokensRepository,
    private readonly jwtService: JwtService,
  ) {}

  // 회원가입
  async signup(request: SignUpRequestDto): Promise<SignUpResponseDto> {
    if (await this.userRepository.existsByEmail(request.email)) {
      throw new AuthException(AuthErrors[AuthErrorCode.EMAIL_ALREADY_EXISTS]);
    }
    const hashedPassword = await PasswordUtil.hash(request.password);

    const newUser: Partial<User> = {
      _id: new Types.ObjectId(),
      name: request.name,
      email: request.email,
      passwordHash: hashedPassword,
    };

    const created: UserDocument = await this.userRepository.create(newUser);
    return plainToInstance(SignUpResponseDto, created, {
      excludeExtraneousValues: true,
    });
  }

  // 로그인
  async login(request: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new AuthException(AuthErrors[AuthErrorCode.INVALID_CREDENTIALS]);
    }

    const isSamePassword = await PasswordUtil.compare(
      request.password,
      user.passwordHash,
    );
    if (!isSamePassword) {
      throw new AuthException(AuthErrors[AuthErrorCode.INVALID_CREDENTIALS]);
    }

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: request.email,
      roles: user.roles,
    };

    // 기존 토큰 모두 폐기
    await this.refreshTokenRepository.revokeAllByUser(user._id);

    // 새로운 토큰 발행
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${this.jwtCfg.accessExpiresMins}m`,
    });
    const refreshToken = randomTokenString();
    const hash = await PasswordUtil.hash(refreshToken);

    await this.refreshTokenRepository.create(
      new Types.ObjectId(user._id),
      hash,
      new Date(Date.now() + this.jwtCfg.refreshExpiresDays * 24 * 3600 * 1000),
    );

    return { accessToken, refreshToken };
  }

  // 리프레시 토큰 갱신
  async refresh(oldToken: string): Promise<RefreshTokenResponseDto> {
    const refreshToken =
      await this.refreshTokenRepository.findByToken(oldToken);
    if (
      !refreshToken ||
      refreshToken.revoked ||
      refreshToken.expiresAt < new Date()
    ) {
      throw new AuthException(AuthErrors[AuthErrorCode.INVALID_REFRESH_TOKEN]);
    }

    // revoke old
    await this.refreshTokenRepository.revoke(refreshToken._id);

    // issue new
    const userId = refreshToken.userId;
    const user = await this.userRepository.findById(refreshToken.userId);
    if (!user) {
      throw new AuthException(AuthErrors[AuthErrorCode.USER_NOT_FOUND]);
    }

    const payload: JwtPayload = {
      sub: userId.toString(),
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${this.jwtCfg.accessExpiresMins}m`,
    });
    const newRefresh = randomTokenString();
    const newHash = await PasswordUtil.hash(newRefresh);
    await this.refreshTokenRepository.create(
      refreshToken.userId,
      newHash,
      new Date(Date.now() + this.jwtCfg.refreshExpiresDays * 24 * 3600 * 1000),
    );
    return { accessToken };
  }
}
