// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, INestMicroservice } from '@nestjs/common';
import {
  ClientProxy,
  ClientsModule,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { Connection } from 'mongoose';
import { AuthModule } from '@auth-microservice/auth.module';
import { GlobalRpcExceptionFilter } from '@api-contracts/filters/global-rpc-exception.filter';
import { getConnectionToken } from '@nestjs/mongoose';
import { firstValueFrom } from 'rxjs';
import { LoginRequestDto } from '@api-contracts/dto/auth/login-request.dto';
import { RefreshTokenRequestDto } from '@api-contracts/dto/auth/refresh-token-request.dto';
import { SignUpRequestDto } from '@api-contracts/dto/auth/signup-request.dto';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { LoginResponseDto } from '@api-contracts/dto/auth/login-response.dto';
import { RefreshTokenResponseDto } from '@api-contracts/dto/auth/refresh-token-response.dto';
import { AuthErrorCode } from '@auth-microservice/shared/exceptions/auth-error-code.enum';
const SERVICE_AUTH = 'AUTH_SERVICE';
const PORT = 3002;

describe('인증 마이크로서비스 통합 테스트', () => {
  let app: INestApplication;
  let client: ClientProxy;
  let dbConnection: Connection;
  let authRpc: INestMicroservice;
  let testUser: {
    email: string;
    password: string;
    name: string;
  };

  // TCP 클라이언트 생성 및 연결 함수
  const createAndConnectClient = async (): Promise<void> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ClientsModule.register([
          {
            name: SERVICE_AUTH,
            transport: Transport.TCP,
            options: {
              host: 'localhost',
              port: PORT,
            },
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    authRpc = app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: { host: 'localhost', port: PORT },
    });

    authRpc.useGlobalFilters(new GlobalRpcExceptionFilter());

    await app.startAllMicroservices();
    await app.init();

    client = app.get<ClientProxy>(SERVICE_AUTH);

    dbConnection = moduleFixture.get<Connection>(getConnectionToken());
    console.log('MongoDB connection state:', dbConnection.readyState);

    await client.connect();
  };

  beforeAll(async () => {
    // 앱, 마이크로서비스 하이브리드 연결
    await createAndConnectClient();

    // 테스트용 사용자 정보 설정
    testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'Test1234!@',
      name: 'Test User',
    };
  });

  afterAll(async () => {
    await client?.close();
    await app?.close();
    await authRpc?.close();
    await dbConnection?.close();
  });

  it('새로운 사용자 회원가입을 수행해야 한다', async () => {
    const signupDto: SignUpRequestDto = {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
    };
    const res = await firstValueFrom(
      client.send(MessagePatterns.AUTH_SIGNUP, signupDto),
    );
    expect(res).toHaveProperty('id');
    expect(res.email).toBe(signupDto.email);
    expect(res.name).toBe(signupDto.name);
  });

  it('중복 이메일로 회원가입 시 예외가 발생해야 한다', async () => {
    const dto: SignUpRequestDto = { ...testUser };
    await expect(
      firstValueFrom(client.send(MessagePatterns.AUTH_SIGNUP, dto)),
    ).rejects.toMatchObject({
      errorCode: AuthErrorCode.EMAIL_ALREADY_EXISTS,
    });
  });

  it('유효한 자격 증명으로 로그인해야 한다', async () => {
    const loginDto: LoginRequestDto = {
      email: testUser.email,
      password: testUser.password,
    };
    const res = await firstValueFrom(
      client.send(MessagePatterns.AUTH_LOGIN, loginDto),
    );
    expect(res).toHaveProperty('accessToken');
    expect(res).toHaveProperty('refreshToken');
  });

  it('잘못된 비밀번호로 로그인 시 예외가 발생해야 한다', async () => {
    const dto: LoginRequestDto = {
      email: testUser.email,
      password: 'WrongPassword!',
    };
    await expect(
      firstValueFrom(client.send(MessagePatterns.AUTH_LOGIN, dto)),
    ).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_CREDENTIALS,
    });
  });

  it('존재하지 않는 이메일로 로그인 시 예외가 발생해야 한다', async () => {
    const dto: LoginRequestDto = {
      email: 'noone@example.com',
      password: 'whatever',
    };
    await expect(
      firstValueFrom(client.send(MessagePatterns.AUTH_LOGIN, dto)),
    ).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_CREDENTIALS,
    });
  });

  it('리프레시 토큰으로 엑세스 토큰을 갱신해야 한다', async () => {
    // 먼저 로그인해서 리프레시 토큰 획득
    const requestDto: LoginRequestDto = {
      email: testUser.email,
      password: testUser.password,
    };
    const { refreshToken }: LoginResponseDto = await firstValueFrom(
      client.send<LoginResponseDto>(MessagePatterns.AUTH_LOGIN, requestDto),
    );

    // 리프레시 요청
    const refreshDto: RefreshTokenRequestDto = { refreshToken };
    const refreshRes: RefreshTokenResponseDto = await firstValueFrom(
      client.send(MessagePatterns.AUTH_REFRESH, refreshDto),
    );
    expect(refreshRes).toHaveProperty('accessToken');
  });

  it('유효하지 않은 리프레시 토큰으로 갱신 시 예외가 발생해야 한다', async () => {
    const invalidDto: RefreshTokenRequestDto = {
      refreshToken: 'invalid.token.value',
    };
    await expect(
      firstValueFrom(client.send(MessagePatterns.AUTH_REFRESH, invalidDto)),
    ).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
    });
  });
});
