import { RpcException } from "@nestjs/microservices";

export class DatabaseRpcException extends RpcException {
  public readonly originalError: any;

  constructor(error: any, message?: string) {
    // error가 Error 객체이면 message로, 아니면 직접 message 사용
    super(message || (error && error.message) || "Database Error");
    this.originalError = error;
  }
}
