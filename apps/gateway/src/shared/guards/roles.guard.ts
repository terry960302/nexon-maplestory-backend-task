import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@gateway/shared/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<string[]>(ROLES_KEY, ctx.getHandler()) ||
      this.reflector.get<string[]>(ROLES_KEY, ctx.getClass());
    if (!requiredRoles?.length) {
      return true; // 메타데이터가 없으면 통과
    }

    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // JwtAuthGuard가 붙어 있어야 함

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('권한이 없습니다');
    }
    return true;
  }
}
