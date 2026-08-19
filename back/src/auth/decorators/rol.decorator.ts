


import { SetMetadata } from '@nestjs/common';
import { Role } from '../../common/enum/rol.enum';


// SetMetadada => Adjunta datoa arbitrarios a un metodo/clase que despues el reflector puede leer.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
