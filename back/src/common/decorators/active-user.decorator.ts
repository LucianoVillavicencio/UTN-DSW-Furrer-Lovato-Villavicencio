// Injects the JWT payload that AuthGuard attached to the request, so a handler
// never has to read an identity out of the body or the route params.
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  UserActiveInterface,
} from '../interfaces/user-active.interface';

export const ActiveUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserActiveInterface | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
