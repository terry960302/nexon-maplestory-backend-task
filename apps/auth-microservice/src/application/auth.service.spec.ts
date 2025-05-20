// src/modules/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '@auth-microservice/infrastructure/repositories/user.repository';
import { RefreshTokensRepository } from '@auth-microservice/infrastructure/repositories/refresh-token.repository';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { AuthException } from '@auth-microservice/shared/exceptions/auth.exception';
import {
  AuthErrorCode,
  AuthErrors,
} from '@auth-microservice/shared/exceptions/auth-error-code.enum';
import { PasswordUtil } from '@auth-microservice/shared/utils/password.util';
import { LoginResponseDto } from '@api-contracts/dto/auth/login-response.dto';
import jwtConfig from '@api-contracts/config/jwt.config';
import { AuthService } from '@auth-microservice/application/auth.service';

describe('인증 서비스 (AuthService)', () => {
  let service: AuthService;
  let userRepo: UserRepository;
  let tokenRepo: RefreshTokensRepository;
  let jwtService: JwtService;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    roles: ['user'],
  };
  const mockJwtConfig = {
    secretKey: 'test-secret',
    accessExpiresMins: 15,
    refreshExpiresDays: 7,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            existsByEmail: jest.fn(),
          },
        },
        {
          provide: RefreshTokensRepository,
          useValue: {
            create: jest.fn(),
            findByHash: jest.fn(),
            revoke: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepo = module.get(UserRepository);
    tokenRepo = module.get(RefreshTokensRepository);
    jwtService = module.get(JwtService);
  });

  describe('로그인 기능', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('유효한 자격 증명일 때 액세스/리프레시 토큰을 반환해야 한다', async () => {
      jest.spyOn(userRepo, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(PasswordUtil, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mockAccessToken');
      jest.spyOn(tokenRepo, 'create').mockResolvedValue({} as any);

      const result: LoginResponseDto = await service.login(loginDto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(userRepo.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(tokenRepo.create).toHaveBeenCalled();
    });

    it('사용자를 찾을 수 없으면 AuthException(INVALID_CREDENTIALS)을 던져야 한다', async () => {
      jest.spyOn(userRepo, 'findByEmail').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new AuthException(AuthErrors[AuthErrorCode.INVALID_CREDENTIALS]),
      );
      await expect(service.login(loginDto)).rejects.toMatchObject({
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });
    });

    it('비밀번호가 틀리면 AuthException(INVALID_CREDENTIALS)을 던져야 한다', async () => {
      jest.spyOn(userRepo, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(PasswordUtil, 'compare').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new AuthException(AuthErrors[AuthErrorCode.INVALID_CREDENTIALS]),
      );
      await expect(service.login(loginDto)).rejects.toMatchObject({
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });
    });
  });

  describe('토큰 갱신 기능', () => {
    const refreshDto = { refreshToken: 'validRefreshToken' };
    const mockRefreshToken = {
      _id: new Types.ObjectId(),
      userId: mockUser._id,
      tokenHash: 'hashedToken',
      expiresAt: new Date(Date.now() + 86_400_000),
      revoked: false,
    };

    it('유효한 리프레시 토큰일 때 새로운 액세스 토큰을 반환해야 한다', async () => {
      jest
        .spyOn(tokenRepo, 'findByToken')
        .mockResolvedValue(mockRefreshToken as any);
      jest.spyOn(userRepo, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('newAccessToken');
      jest.spyOn(tokenRepo, 'revoke').mockResolvedValue();
      jest.spyOn(tokenRepo, 'create').mockResolvedValue({} as any);

      const result = await service.refresh(refreshDto.refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(tokenRepo.findByToken).toHaveBeenCalled();
      expect(tokenRepo.revoke).toHaveBeenCalledWith(mockRefreshToken._id);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(tokenRepo.create).toHaveBeenCalled();
    });

    it('유효하지 않은 리프레시 토큰이면 AuthException(INVALID_REFRESH_TOKEN)을 던져야 한다', async () => {
      jest.spyOn(tokenRepo, 'findByToken').mockResolvedValue(null);

      await expect(service.refresh(refreshDto.refreshToken)).rejects.toThrow(
        new AuthException(AuthErrors[AuthErrorCode.INVALID_REFRESH_TOKEN]),
      );
      await expect(
        service.refresh(refreshDto.refreshToken),
      ).rejects.toMatchObject({
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    });

    it('만료된 리프레시 토큰이면 AuthException(INVALID_REFRESH_TOKEN)을 던져야 한다', async () => {
      const expired = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1_000),
      };
      jest.spyOn(tokenRepo, 'findByToken').mockResolvedValue(expired as any);

      await expect(service.refresh(refreshDto.refreshToken)).rejects.toThrow(
        new AuthException(AuthErrors[AuthErrorCode.INVALID_REFRESH_TOKEN]),
      );
      await expect(
        service.refresh(refreshDto.refreshToken),
      ).rejects.toMatchObject({
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    });
  });
});
