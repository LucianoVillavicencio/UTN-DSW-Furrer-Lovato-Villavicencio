import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment } from './entity/payment.entity';
import { subscriptionService } from '../subscription/subscription.service';
import { SubscriptionState } from '../subscription/enum/subscription-state.enum';
import { UserService } from '../user/user.service';

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
        { provide: subscriptionService, useValue: subscriptions },
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
        plan: { numDays: 30, price: 15000 },
      }),
      activate: jest.fn().mockResolvedValue(undefined),
    };
    await buildService();

    await service.createManualPayment(dto, 30111222);

    expect(subscriptions.activate).toHaveBeenCalledWith(7);
    expect(repository.save).toHaveBeenCalled();
  });

  // The old "leaves an already ACTIVE subscription alone" case lived here.
  // That was the bug: an advance payment against an ACTIVE subscription must
  // extend endDate, not be ignored. It's replaced by the
  // 'createManualPayment — advance payment' describe block below, which
  // covers the fixed three-way branch (PENDING/ACTIVE/PAUSED).

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

describe('createManualPayment — advance payment', () => {
  let service: PaymentService;
  let repository: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let subscriptions: {
    findSubscription: jest.Mock;
    activate: jest.Mock;
    renew: jest.Mock;
  };
  let users: { findUser: jest.Mock };

  const dto = { subscriptionId: 7, amount: 15000, payMethod: 'efectivo' };
  const plan = { numDays: 30, price: 15000 };

  const buildService = async () => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn().mockResolvedValue([]),
    };
    users = { findUser: jest.fn().mockResolvedValue(null) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: repository },
        { provide: subscriptionService, useValue: subscriptions },
        { provide: UserService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(PaymentService);
  };

  afterEach(() => {
    delete process.env.MP_ENABLED;
  });

  it('extends an ACTIVE subscription instead of ignoring it', async () => {
    // The bug: today this writes a payment row and leaves endDate untouched,
    // so a member paying early in cash gets nothing for their money.
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.ACTIVE,
        deleted: false,
        plan,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
      renew: jest.fn().mockResolvedValue(undefined),
    };
    await buildService();

    await service.createManualPayment(dto, 30111222);

    expect(subscriptions.renew).toHaveBeenCalledWith(7, 30);
    expect(subscriptions.activate).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
  });

  it('still activates a PENDING subscription', async () => {
    // The existing behaviour must not regress: this is the self-service gate.
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.PENDING,
        deleted: false,
        plan,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
      renew: jest.fn().mockResolvedValue(undefined),
    };
    await buildService();

    await service.createManualPayment(dto, 30111222);

    expect(subscriptions.activate).toHaveBeenCalledWith(7);
    expect(subscriptions.renew).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
  });

  it('refuses a payment against a PAUSED subscription', async () => {
    // Extending a frozen membership here AND at unpause would hand the
    // member the same days twice.
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.PAUSED,
        deleted: false,
        plan,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
      renew: jest.fn().mockResolvedValue(undefined),
    };
    await buildService();

    await expect(service.createManualPayment(dto, 30111222)).rejects.toThrow(
      new ConflictException('Reanudá la membresía antes de registrar un pago.'),
    );
    expect(subscriptions.activate).not.toHaveBeenCalled();
    expect(subscriptions.renew).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('works with MP_ENABLED=false', async () => {
    // Cash must never depend on Mercado Pago being configured or reachable.
    process.env.MP_ENABLED = 'false';
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.ACTIVE,
        deleted: false,
        plan,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
      renew: jest.fn().mockResolvedValue(undefined),
    };
    await buildService();

    await expect(
      service.createManualPayment(dto, 30111222),
    ).resolves.toBeDefined();
    expect(repository.save).toHaveBeenCalled();
  });
});

describe('createFromMercadoPago', () => {
  let service: PaymentService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let subscriptions: {
    findSubscription: jest.Mock;
    activate: jest.Mock;
    renew: jest.Mock;
  };
  let users: { findUser: jest.Mock };

  const plan = { numDays: 30, price: 15000 };

  const buildService = async (existingPayment: unknown = null) => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(existingPayment),
    };
    users = { findUser: jest.fn().mockResolvedValue(null) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: repository },
        { provide: subscriptionService, useValue: subscriptions },
        { provide: UserService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(PaymentService);
  };

  it('records a completed payment and activates a pending subscription', async () => {
    // registeredById stays null for an online renewal — nobody recorded it.
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.PENDING,
        deleted: false,
        plan,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
      renew: jest.fn().mockResolvedValue(undefined),
    };
    await buildService(null);

    const result = await service.createFromMercadoPago({
      mpPaymentId: 'mp-123',
      subscriptionId: 7,
      amount: 15000,
      termMonths: 1,
      payMethod: 'mercadopago',
    });

    expect(subscriptions.activate).toHaveBeenCalledWith(7);
    expect(subscriptions.renew).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ registeredById: null, mpPaymentId: 'mp-123' }),
    );
    expect(result).toBeDefined();
  });

  it('renews instead of activating when the subscription is already active', async () => {
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.ACTIVE,
        deleted: false,
        plan,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
      renew: jest.fn().mockResolvedValue(undefined),
    };
    await buildService(null);

    await service.createFromMercadoPago({
      mpPaymentId: 'mp-124',
      subscriptionId: 7,
      amount: 15000,
      termMonths: 1,
      payMethod: 'mercadopago',
    });

    expect(subscriptions.renew).toHaveBeenCalledWith(7, 30);
    expect(subscriptions.activate).not.toHaveBeenCalled();
  });

  it('extends by the full multi-month term, not by one month', async () => {
    // A 12-month term on a 30-day plan must add 360 days.
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.ACTIVE,
        deleted: false,
        plan,
      }),
      activate: jest.fn().mockResolvedValue(undefined),
      renew: jest.fn().mockResolvedValue(undefined),
    };
    await buildService(null);

    await service.createFromMercadoPago({
      mpPaymentId: 'mp-125',
      subscriptionId: 7,
      amount: 150000,
      termMonths: 12,
      payMethod: 'mercadopago',
    });

    expect(subscriptions.renew).toHaveBeenCalledWith(7, 360);
  });

  it('returns the existing payment when mpPaymentId was already recorded', async () => {
    // MP retries a notification up to eight times over four days. The second
    // delivery must not write a second row, and must not extend twice.
    const existingPayment = { id: 99, mpPaymentId: 'mp-126', amount: 15000 };
    subscriptions = {
      findSubscription: jest.fn(),
      activate: jest.fn(),
      renew: jest.fn(),
    };
    await buildService(existingPayment);

    const result = await service.createFromMercadoPago({
      mpPaymentId: 'mp-126',
      subscriptionId: 7,
      amount: 15000,
      termMonths: 1,
      payMethod: 'mercadopago',
    });

    expect(result).toBe(existingPayment);
    expect(subscriptions.findSubscription).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('snapshots termMonths and monthlyPriceAtPurchase', async () => {
    // A refund years later must use the prices actually agreed.
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        id: 7,
        state: SubscriptionState.PENDING,
        deleted: false,
        plan: { numDays: 30, price: 20000 },
      }),
      activate: jest.fn().mockResolvedValue(undefined),
      renew: jest.fn().mockResolvedValue(undefined),
    };
    await buildService(null);

    await service.createFromMercadoPago({
      mpPaymentId: 'mp-127',
      subscriptionId: 7,
      amount: 60000,
      termMonths: 3,
      payMethod: 'mercadopago',
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ termMonths: 3, monthlyPriceAtPurchase: 20000 }),
    );
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
        { provide: subscriptionService, useValue: {} },
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
