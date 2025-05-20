import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { LoginRequestDto } from '@api-contracts/dto/auth/login-request.dto';
import { LoginResponseDto } from '@api-contracts/dto/auth/login-response.dto';
import { SignUpRequestDto } from '@api-contracts/dto/auth/signup-request.dto';
import { SignUpResponseDto } from '@api-contracts/dto/auth/signup-response.dto';
import { SERVICE_AUTH } from '@gateway/shared/constants/service-names';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { firstValueFrom } from 'rxjs';
import { Public } from '@gateway/shared/decorators/public.decorator';

@Controller('v1/auth')
export class AuthClientController {
  constructor(@Inject(SERVICE_AUTH) private readonly authClient: ClientProxy) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() request: SignUpRequestDto): Promise<SignUpResponseDto> {
    const response$ = this.authClient.send<SignUpResponseDto>(
      MessagePatterns.AUTH_SIGNUP,
      request,
    );
    return firstValueFrom(response$);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() request: LoginRequestDto): Promise<LoginResponseDto> {
    const response$ = this.authClient.send<LoginResponseDto>(
      MessagePatterns.AUTH_LOGIN,
      request,
    );
    return firstValueFrom(response$);
  }
}
