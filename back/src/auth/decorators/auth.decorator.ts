import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './rol.decorator';
import { AuthGuard } from '../guard/auth.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Role } from '../../common/enum/rol.enum';


//@Auth() solo exige estar autenitcado
//@Auth(Role.ADMIN) => Exige el rol admin
//@Auth(Role.USER, Role.ADMIN) => Puedo pedir varios roles


// ApplyDecorators => Combina varios decoradores en 1. En vez de escribir :  @UseGuard(AuthGuard, RolesGuard) @Roles(Role.ADMIN) escribimos =>  @Auth(Role.ADMIN)


export function Auth(...roles: Role[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
}
