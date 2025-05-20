import { HttpException } from "@nestjs/common";
import { ExceptionDescriptor } from "@api-contracts/exceptions/exception-descriptor.interface";

export class BaseHttpException extends HttpException {
  constructor(
    descriptor: ExceptionDescriptor,
    message?: string,
    details?: any
  ) {
    super(
      {
        statusCode: descriptor.statusCode,
        errorCode: descriptor.errorCode,
        message: message || descriptor.message,
        ...(details ? { details } : {}),
        timestamp: new Date().toISOString(),
      },
      descriptor.statusCode
    );
  }
}
