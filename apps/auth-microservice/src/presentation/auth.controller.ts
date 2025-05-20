import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { SignUpRequestDto } from '@api-contracts/dto/auth/signup-request.dto';
import { SignUpResponseDto } from '@api-contracts/dto/auth/signup-response.dto';
import { LoginRequestDto } from '@api-contracts/dto/auth/login-request.dto';
import { LoginResponseDto } from '@api-contracts/dto/auth/login-response.dto';
import { AuthService } from '@auth-microservice/application/auth.service';
import { RefreshTokenRequestDto } from '@api-contracts/dto/auth/refresh-token-request.dto';
import { RefreshTokenResponseDto } from '@api-contracts/dto/auth/refresh-token-response.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MessagePatterns.AUTH_SIGNUP)
  async signUp(
    @Payload() request: SignUpRequestDto,
  ): Promise<SignUpResponseDto> {
    return this.authService.signup(request);
  }

  @MessagePattern(MessagePatterns.AUTH_LOGIN)
  async login(@Payload() request: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(request);
  }

  @MessagePattern(MessagePatterns.AUTH_REFRESH)
  async refresh(
    @Payload() dto: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }
}
