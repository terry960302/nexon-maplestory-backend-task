import { ExceptionDescriptor } from "@api-contracts/exceptions/exception-descriptor.interface";
import { RpcException } from "@nestjs/microservices";

export class BaseRpcException extends RpcException {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    descriptor: ExceptionDescriptor,
    message?: string,
    details?: any
  ) {
    const payload = {
      statusCode: descriptor.statusCode,
      errorCode: descriptor.errorCode,
      message: message || descriptor.message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
    };
    super(payload);

    this.statusCode = descriptor.statusCode;
    this.errorCode = descriptor.errorCode;
    this.details = details;
    this.timestamp = payload.timestamp;
  }
}
