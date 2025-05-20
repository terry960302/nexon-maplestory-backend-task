import { ExceptionDescriptor } from '@api-contracts/exceptions/exception-descriptor.interface';

export enum GatewayErrorCode {
  TIMEOUT = 'GATEWAY_0000',
  FORBIDDEN_IP = 'GATEWAY_0001',
  INVALID_AUTH_HEADER = 'GATEWAY_0002',
  TOO_MANY_REQUESTS = 'GATEWAY_0003',
}

export const GatewayErrors: Record<GatewayErrorCode, ExceptionDescriptor> = {
  [GatewayErrorCode.TIMEOUT]: {
    errorCode: GatewayErrorCode.TIMEOUT,
    statusCode: 504,
    message: '마이크로서비스 응답 시간이 초과되었습니다.',
  },
  [GatewayErrorCode.FORBIDDEN_IP]: {
    errorCode: GatewayErrorCode.FORBIDDEN_IP,
    statusCode: 403,
    message: '허용되지 않은 IP입니다.',
  },
  [GatewayErrorCode.INVALID_AUTH_HEADER]: {
    errorCode: GatewayErrorCode.INVALID_AUTH_HEADER,
    statusCode: 401,
    message: 'Authorization 헤더가 유효하지 않습니다.',
  },
  [GatewayErrorCode.TOO_MANY_REQUESTS]: {
    errorCode: GatewayErrorCode.TOO_MANY_REQUESTS,
    statusCode: 429,
    message:
      '해당 IP는 분당 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  },
};
