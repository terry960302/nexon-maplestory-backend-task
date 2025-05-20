import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { GatewayException } from '@gateway/shared/exceptions/gateway.exception';
import {
  GatewayErrorCode,
  GatewayErrors,
} from '@gateway/shared/exceptions/gateway-error-code.exception';

@Injectable()
export class RpcTimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new GatewayException(GatewayErrors[GatewayErrorCode.TIMEOUT]);
        }
        throw err;
      }),
    );
  }
}
