
//RolesGuard => Corre despues de authGuard y decide si el rol alcanza.


import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/rol.decorator';
import { Role } from '../../common/enum/rol.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {



    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }


    const { user } = context.switchToHttp().getRequest();

    // Le doy acceso o privilegio siempre a ADMIN. Sin importar que roles pida el endpoint
    if(user.role === Role.ADMIN) {
      return true;
    }

    return requiredRoles.includes(user.role);
    
  }
}
