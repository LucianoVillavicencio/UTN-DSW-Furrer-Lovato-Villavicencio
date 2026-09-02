import { INestApplication, Type } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '../../common/enum/role.enum';
import type { UserActiveInterface } from '../../common/interfaces/user-active.interface';

const TEST_SECRET = 'authz-harness-secret';

export type ServiceMock = {
  provide: unknown;
  useValue: Record<string, jest.Mock>;
};

/** Passed where a token is expected, to express "send no Authorization header". */
export const ANONYMOUS = undefined;

let jwtService: JwtService | undefined;

/**
 * Boots one controller with the real AuthGuard and RolesGuard and a real
 * JwtService, with the service layer mocked. No database and no AppModule, so
 * this runs under `npm test` next to the other unit specs.
 *
 * `guardOverrides` swaps out a route-level guard (one applied via
 * `@UseGuards(SomeGuard)`, e.g. OwnerPasswordGuard) for a mock. Nest resolves
 * such guards through its `injectables` map, a structure `providers` never
 * touches — so a plain `{ provide: SomeGuard, useValue }` entry in
 * `serviceMocks` is silently ignored and the real guard (with its real
 * dependencies) still gets constructed. `overrideGuard(...).useValue(...)` is
 * the API that actually reaches that map.
 */
export async function buildAuthzApp(
  controller: Type<unknown>,
  serviceMocks: ServiceMock[],
  guardOverrides: ServiceMock[] = [],
): Promise<INestApplication> {
  const builder = Test.createTestingModule({
    imports: [
      JwtModule.register({
        global: true,
        secret: TEST_SECRET,
        signOptions: { expiresIn: '5m' },
      }),
    ],
    controllers: [controller],
    providers: serviceMocks.map((mock) => ({
      provide: mock.provide,
      useValue: mock.useValue,
    })),
  });

  for (const override of guardOverrides) {
    builder.overrideGuard(override.provide).useValue(override.useValue);
  }

  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  jwtService = moduleRef.get(JwtService);
  await app.init();
  return app;
}

/**
 * A signed token for one of the two actors. `sub` carries the member's id, so
 * a test can ask for a token belonging to somebody else's account.
 * `profileComplete` defaults to true, because almost every row of the
 * authorization matrix is about roles rather than about the completion gate.
 */
export function tokenFor(
  actor: 'member' | 'admin',
  sub = 40000001,
  profileComplete = true,
): string {
  if (!jwtService) {
    throw new Error('tokenFor called before buildAuthzApp');
  }

  const payload: UserActiveInterface = {
    sub,
    email: actor === 'admin' ? 'admin@flg.test' : 'member@flg.test',
    role: actor === 'admin' ? Role.ADMIN : Role.USER,
    profileComplete,
  };

  return jwtService.sign(payload);
}
