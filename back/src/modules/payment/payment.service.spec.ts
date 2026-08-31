import { Test } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment } from './entity/payment.entity';
import { subscriptionService } from '../subscription/subscription.service';
import { SubscriptionState } from '../subscription/enum/subscription-state.enum';
import { UserService } from '../user/user.service';
import { PlanService } from '../plan/plan.service';
import { PlanDurationService } from '../plan/plan-duration.service';

describe('PaymentService.createManualPayment', () => {
  let service: PaymentService;
  let repository: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let subscriptions: { findSubscription: jest.Mock; activate: jest.Mock };
  let users: { findUser: jest.Mock };

  const dto = { subscriptionId: 7, amount: 15000, payMethod: 'efectivo' };

  const buildService = async () => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn().mockResolvedValue([]),
    };
    users = users ?? { findUser: jest.fn().mockResolvedValue(null) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: repository },
        { provide: getDataSourceToken(), useValue: {} },
        { provide: subscriptionService, useValue: subscriptions },
        { provide: PlanService, useValue: {} },
        { provide: PlanDurationService, useValue: {} },
        { provide: UserService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(PaymentService);
  };

  it('promotes a PENDING subscription when the payment is recorded', async () => {
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.PENDING,
        deleted: false,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
    };
    await buildService();

    await service.createManualPayment(dto, 30111222);

    expect(subscriptions.activate).toHaveBeenCalledWith(7);
    expect(repository.save).toHaveBeenCalled();
  });

  it('leaves an already ACTIVE subscription alone', async () => {
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.ACTIVE,
        deleted: false,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
    };
    await buildService();

    await service.createManualPayment(dto, 30111222);

    expect(subscriptions.activate).not.toHaveBeenCalled();
  });

  it('activates nothing when the subscription does not exist', async () => {
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue(null),
      activate: jest.fn().mockResolvedValue(undefined),
    };
    await buildService();

    await expect(
      service.createManualPayment(dto, 30111222),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(subscriptions.activate).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('PaymentService.findAll', () => {
  let service: PaymentService;
  let repository: { find: jest.Mock };
  let users: { findUser: jest.Mock };

  const buildService = async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: repository },
        { provide: getDataSourceToken(), useValue: {} },
        { provide: subscriptionService, useValue: {} },
        { provide: PlanService, useValue: {} },
        { provide: PlanDurationService, useValue: {} },
        { provide: UserService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(PaymentService);
  };

  it('attaches the recording admin name to a payment with registeredById', async () => {
    repository = {
      find: jest.fn().mockResolvedValue([{ id: 1, registeredById: 30111222 }]),
    };
    users = {
      findUser: jest
        .fn()
        .mockResolvedValue({ id: 30111222, name: 'Ana', surname: 'Pérez' }),
    };
    await buildService();

    const result = await service.findAll();

    expect(result[0].registeredByName).toBe('Ana Pérez');
    expect(users.findUser).toHaveBeenCalledWith(30111222);
  });

  it('leaves registeredByName null for a payment with no recording admin', async () => {
    repository = {
      find: jest.fn().mockResolvedValue([{ id: 1, registeredById: null }]),
    };
    users = { findUser: jest.fn() };
    await buildService();

    const result = await service.findAll();

    expect(result[0].registeredByName).toBeNull();
    expect(users.findUser).not.toHaveBeenCalled();
  });

  it('looks up each distinct admin only once', async () => {
    repository = {
      find: jest.fn().mockResolvedValue([
        { id: 1, registeredById: 30111222 },
        { id: 2, registeredById: 30111222 },
      ]),
    };
    users = {
      findUser: jest
        .fn()
        .mockResolvedValue({ id: 30111222, name: 'Ana', surname: 'Pérez' }),
    };
    await buildService();

    await service.findAll();

    expect(users.findUser).toHaveBeenCalledTimes(1);
  });
});

describe('PaymentService.registerPlanPayment', () => {
  let service: PaymentService;
  let repository: { create: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let manager: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let subscriptions: { replaceActiveSubscription: jest.Mock };
  let plans: { findPlan: jest.Mock };
  let durations: { findByPlan: jest.Mock };
  let users: { findUser: jest.Mock };

  const dto = {
    userId: 5,
    planId: 2,
    months: 6,
    amount: 300,
    payMethod: 'efectivo',
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
    };
    manager = {
      // Mirrors real TypeORM: manager.create(EntityClass, data) returns an
      // actual instance of EntityClass, not a plain object. The rollback
      // test below relies on `entity instanceof Payment` being true.
      create: jest.fn((entityClass: new () => object, data: object) =>
        Object.assign(new entityClass(), data),
      ),
      save: jest.fn((entity: unknown) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
    };
    dataSource = {
      // Actually invokes the callback with the mock manager and returns its
      // promise as-is, so a callback rejection propagates out of
      // dataSource.transaction(...) exactly like TypeORM's real rollback.
      transaction: jest.fn((cb: (manager: unknown) => Promise<unknown>) =>
        cb(manager),
      ),
    };
    subscriptions = {
      replaceActiveSubscription: jest.fn().mockResolvedValue({ id: 42 }),
    };
    plans = {
      findPlan: jest.fn().mockResolvedValue({
        id: 2,
        name: 'Premium',
        price: 100,
        numDays: 30,
        deleted: false,
      }),
    };
    durations = {
      findByPlan: jest.fn().mockResolvedValue([
        {
          id: 9,
          planId: 2,
          months: 6,
          numDays: 180,
          price: 300,
          deleted: false,
        },
      ]),
    };
    users = {
      findUser: jest.fn().mockResolvedValue({ id: 5, deleted: false }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: repository },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: subscriptionService, useValue: subscriptions },
        { provide: PlanService, useValue: plans },
        { provide: PlanDurationService, useValue: durations },
        { provide: UserService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(PaymentService);
  });

  it('writes the subscription and the payment together', async () => {
    const payment = await service.registerPlanPayment(dto, 1);
    expect(subscriptions.replaceActiveSubscription).toHaveBeenCalled();
    expect(payment).toMatchObject({
      subscriptionId: 42,
      amount: 300,
      payMethod: 'efectivo',
      registeredById: 1,
      state: 'completado',
    });
  });

  it('leaves no subscription behind when the payment insert fails', async () => {
    // The finding-6 regression. This is the only test that proves the
    // transaction is real rather than decorative.
    manager.save.mockImplementation((entity: unknown) => {
      if (entity instanceof Payment) throw new Error('insert failed');
      return Promise.resolve(entity);
    });
    await expect(service.registerPlanPayment(dto, 1)).rejects.toThrow(
      'insert failed',
    );
    expect(dataSource.transaction).toHaveBeenCalled();
    // dataSource.transaction rethrows after rolling back; the mock asserts
    // the callback threw rather than swallowing.
  });

  it('refuses a deleted member', async () => {
    users.findUser.mockResolvedValue({ id: 5, deleted: true });
    await expect(service.registerPlanPayment(dto, 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('refuses a deleted plan', async () => {
    plans.findPlan.mockResolvedValue(null);
    await expect(service.registerPlanPayment(dto, 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('refuses a duration the plan does not offer', async () => {
    durations.findByPlan.mockResolvedValue([]);
    await expect(service.registerPlanPayment(dto, 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolves the period itself and ignores anything the client sent', async () => {
    await service.registerPlanPayment({ ...dto, months: 6 }, 1);
    const [, input] = subscriptions.replaceActiveSubscription.mock.calls[0] as [
      unknown,
      { term: { numDays: number } },
    ];
    expect(input.term.numDays).toBe(180);
  });
});
