import { BaseRpcException } from "@api-contracts/exceptions/base-rpc.exception";
import {
  GlobalErrorCode,
  GlobalErrors,
} from "@api-contracts/exceptions/global-error-code.exception";
import {
  Catch,
  ArgumentsHost,
  HttpException,
  RpcExceptionFilter,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Observable, throwError } from "rxjs";

@Catch()
export class GlobalRpcExceptionFilter implements RpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<never> {
    console.error("@@@@@@@@ 에러 캐치 => " + exception);
    // 이미 BaseRpcException이면 그대로 래핑해서 반환
    if (exception instanceof BaseRpcException) {
      return throwError(() =>
        exception.getError ? exception.getError() : exception
      );
    }

    // RpcException은 getError()로 반환
    if (exception instanceof RpcException) {
      return throwError(() =>
        exception.getError ? exception.getError() : exception
      );
    }

    // HttpException → BaseRpcException으로 래핑
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any;
      const status = exception.getStatus();
      return throwError(() =>
        new BaseRpcException({
          statusCode: status,
          errorCode: GlobalErrorCode.INTERNAL_ERROR,
          message: exceptionResponse.message || exception.message,
        }).getError()
      );
    }

    // 일반 Error → BaseRpcException으로 래핑
    if (exception instanceof Error) {
      return throwError(() =>
        new BaseRpcException({
          statusCode: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].statusCode,
          errorCode: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].errorCode,
          message:
            exception.message ||
            GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].message,
        }).getError()
      );
    }

    // 기타 (undefined, string, object 등) → BaseRpcException으로 래핑
    return throwError(() =>
      new BaseRpcException({
        statusCode: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].statusCode,
        errorCode: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].errorCode,
        message: GlobalErrors[GlobalErrorCode.INTERNAL_ERROR].message,
      }).getError()
    );
  }
}
