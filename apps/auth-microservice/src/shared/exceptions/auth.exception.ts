import { BaseRpcException } from '@api-contracts/exceptions/base-rpc.exception';
import { ExceptionDescriptor } from '@api-contracts/exceptions/exception-descriptor.interface';

export class AuthException extends BaseRpcException {
  constructor(
    descriptor: ExceptionDescriptor,
    message?: string,
    details?: any,
  ) {
    super(descriptor, message, details);
  }
}
