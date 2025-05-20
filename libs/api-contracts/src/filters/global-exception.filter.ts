import {
  GlobalErrorCode,
  GlobalErrors,
} from "@api-contracts/exceptions/global-error-code.exception";
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Response, Request } from "express";

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].statusCode;
    let resp: any = {
      statusCode: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].statusCode,
      errorCode: GlobalErrorCode.INTERNAL_ERROR,
      message: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR],
      timestamp: new Date().toISOString(),
      path: request?.url,
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any;
      status = exception.getStatus();
      resp = {
        ...resp,
        ...exceptionResponse,
        timestamp: new Date().toISOString(),
        path: request?.url,
      };
    }
    // 실무에서는 로깅 추가
    response.status(status).json(resp);
  }
}
