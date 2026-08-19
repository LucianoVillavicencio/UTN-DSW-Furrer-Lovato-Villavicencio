

// ActiveUser es un param decorador , le dice a nest en vez de pasarme todo el request extraeme directamente request.user y pasamelo como parametroe


import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
