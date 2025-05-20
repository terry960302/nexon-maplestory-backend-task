import { ExceptionDescriptor } from '@api-contracts/exceptions/exception-descriptor.interface';

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_0001',
  INVALID_REFRESH_TOKEN = 'AUTH_0002',
  USER_NOT_FOUND = 'AUTH_0003',
  ACCESS_DENIED = 'AUTH_0004',
  EMAIL_ALREADY_EXISTS = 'AUTH_0005',
}

export const AuthErrors: Record<AuthErrorCode, ExceptionDescriptor> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    errorCode: AuthErrorCode.INVALID_CREDENTIALS,
    statusCode: 401,
    message: '아이디 또는 비밀번호가 올바르지 않습니다.',
  },
  [AuthErrorCode.INVALID_REFRESH_TOKEN]: {
    errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
    statusCode: 401,
    message: '유효하지 않은 토큰입니다.',
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    errorCode: AuthErrorCode.USER_NOT_FOUND,
    statusCode: 404,
    message: '사용자를 찾을 수 없습니다.',
  },
  [AuthErrorCode.ACCESS_DENIED]: {
    errorCode: AuthErrorCode.ACCESS_DENIED,
    statusCode: 403,
    message: '접근 권한이 없습니다.',
  },
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: {
    errorCode: AuthErrorCode.EMAIL_ALREADY_EXISTS,
    statusCode: 409,
    message: '이미 사용 중인 이메일입니다.',
  },
};
