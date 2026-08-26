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
 */
export async function buildAuthzApp(
  controller: Type<unknown>,
  serviceMocks: ServiceMock[],
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
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
  }).compile();

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
