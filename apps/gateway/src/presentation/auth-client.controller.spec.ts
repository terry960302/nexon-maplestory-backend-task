import { Test, TestingModule } from '@nestjs/testing';
import { AuthClientController } from './auth-client.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { LoginRequestDto } from '@api-contracts/dto/auth/login-request.dto';
import { SignUpRequestDto } from '@api-contracts/dto/auth/signup-request.dto';
import { SERVICE_AUTH } from '@gateway/shared/constants/service-names';
import { MessagePatterns } from '@api-contracts/constants/message-patterns';
import { SignUpResponseDto } from '@api-contracts/dto/auth/signup-response.dto';

describe('AuthClientController', () => {
  let controller: AuthClientController;
  let authClient: ClientProxy;

  const mockAuthClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthClientController],
      providers: [
        {
          provide: SERVICE_AUTH,
          useValue: mockAuthClient,
        },
      ],
    }).compile();

    controller = module.get<AuthClientController>(AuthClientController);
    authClient = module.get<ClientProxy>(SERVICE_AUTH);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const mockSignUpRequest: SignUpRequestDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const mockSignUpResponse: SignUpResponseDto = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should successfully send signup request to auth service', async () => {
      // Given
      mockAuthClient.send.mockReturnValue(of(mockSignUpResponse));

      // When
      const result = await controller.signup(mockSignUpRequest);

      // Then
      expect(mockAuthClient.send).toHaveBeenCalledWith(
        MessagePatterns.AUTH_SIGNUP,
        mockSignUpRequest,
      );
      expect(result).toEqual(mockSignUpResponse);
    });

    it('should handle auth service connection error', async () => {
      // Given
      const error = new Error('Connection refused');
      mockAuthClient.send.mockReturnValue(throwError(() => error));

      // When & Then
      await expect(controller.signup(mockSignUpRequest)).rejects.toThrow(
        'Connection refused',
      );
      expect(mockAuthClient.send).toHaveBeenCalledWith(
        MessagePatterns.AUTH_SIGNUP,
        mockSignUpRequest,
      );
    });
  });

  describe('login', () => {
    const mockLoginRequest: LoginRequestDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockLoginResponse = {
      accessToken: 'mock-jwt-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    it('should successfully send login request to auth service', async () => {
      // Given
      mockAuthClient.send.mockReturnValue(of(mockLoginResponse));

      // When
      const result = await controller.login(mockLoginRequest);

      // Then
      expect(mockAuthClient.send).toHaveBeenCalledWith(
        MessagePatterns.AUTH_LOGIN,
        mockLoginRequest,
      );
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle auth service connection error', async () => {
      // Given
      const error = new Error('Connection refused');
      mockAuthClient.send.mockReturnValue(throwError(() => error));

      // When & Then
      await expect(controller.login(mockLoginRequest)).rejects.toThrow(
        'Connection refused',
      );
      expect(mockAuthClient.send).toHaveBeenCalledWith(
        MessagePatterns.AUTH_LOGIN,
        mockLoginRequest,
      );
    });
  });
});
