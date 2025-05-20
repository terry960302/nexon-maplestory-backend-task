import { ExceptionDescriptor } from '@api-contracts/exceptions/exception-descriptor.interface';
import { BaseHttpException } from '@api-contracts/exceptions/base-http.exception';

export class GatewayException extends BaseHttpException {
  constructor(
    descriptor: ExceptionDescriptor,
    message?: string,
    details?: any,
  ) {
    super(descriptor, message, details);
  }
}
