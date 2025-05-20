// src/common/filters/rpc-to-http.filter.ts
import { BaseRpcException } from '@api-contracts/exceptions/base-rpc.exception';
import {
  GlobalErrorCode,
  GlobalErrors,
} from '@api-contracts/exceptions/global-error-code.exception';
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch(BaseRpcException)
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: BaseRpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // BaseRpcException 이외의 일반 RpcException(문자열 등)은
    const resp: any = {
      statusCode: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].statusCode,
      errorCode: GlobalErrorCode.INTERNAL_ERROR,
      message: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR],
      timestamp: new Date().toISOString(),
      path: request?.url,
    };

    response.status(resp.statusCode).json({
      status: resp.statusCode,
      error: resp.errorCode,
      message: resp.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
