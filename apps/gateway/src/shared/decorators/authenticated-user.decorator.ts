import { AuthenticatedUserDetails } from '@gateway/shared/interfaces/authenticated-user-details.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUserDetails => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthenticatedUserDetails;
  },
);
