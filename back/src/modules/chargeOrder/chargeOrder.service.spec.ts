import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ChargeOrderService } from './chargeOrder.service';
import { ChargeOrder } from './entity/chargeOrder.entity';
import { ChargeOrderStatus } from './enum/chargeOrder-status.enum';
import { subscriptionService } from '../subscription/subscription.service';
import { SubscriptionState } from '../subscription/enum/subscription-state.enum';
import { PlanTermService } from '../planTerm/planTerm.service';
import { ORDER_EXPIRATION_MS } from './chargeOrder.rules';

describe('ChargeOrderService.createCharge', () => {
  let service: ChargeOrderService;
  let repository: {
    manager: { transaction: jest.Mock };
    update: jest.Mock;
  };
  let subscriptions: { findSubscription: jest.Mock };
  let planTerms: { findTerm: jest.Mock };
  // The transaction's EntityManager, and the pessimistic-locked query
  // builder it hands back from createQueryBuilder — chainable, same shape
  // TypeORM's real one exposes for setLock/where/andWhere/getOne.
  let manager: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let queryBuilder: {
    setLock: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
  };

  const subscription = {
    id: 7,
    userId: 3,
    planId: 12,
    state: SubscriptionState.ACTIVE,
    deleted: false,
    plan: { id: 12 },
  };

  const term = {
    id: 55,
    planId: 12,
    months: 1,
    price: 15000,
    deleted: false,
  };

  const params = {
    subscriptionId: 7,
    planTermId: 55,
    method: 'point' as const,
    collectionPointId: 'terminal-1',
    adminId: 30111222,
  };

  // busyOrder: what the pessimistic-locked check finds, if anything.
  const buildService = async (busyOrder: unknown = null) => {
    queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(busyOrder),
    };
    manager = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn((_entity: unknown, data: object) => data),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
    };
    repository = {
      manager: {
        transaction: jest.fn((cb: (manager: unknown) => unknown) =>
          cb(manager),
        ),
      },
      update: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChargeOrderService,
        { provide: getRepositoryToken(ChargeOrder), useValue: repository },
        { provide: subscriptionService, useValue: subscriptions },
        { provide: PlanTermService, useValue: planTerms },
      ],
    }).compile();

    service = moduleRef.get(ChargeOrderService);
  };

  beforeEach(() => {
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue(subscription),
    };
    planTerms = { findTerm: jest.fn().mockResolvedValue(term) };
  });

  it('snapshots the amount from the term, not the plan', async () => {
    await buildService();

    await service.createCharge(params);

    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ amount: term.price }),
    );
  });

  it('refuses a second order on a collection point that is busy', async () => {
    await buildService({
      id: 1,
      collectionPointId: 'terminal-1',
      status: ChargeOrderStatus.PENDING,
    });

    await expect(service.createCharge(params)).rejects.toThrow(
      new ConflictException('Ya hay un cobro en curso en este punto de cobro.'),
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('runs the busy check and the insert inside one transaction, with a pessimistic write lock', async () => {
    // Guards against the race this table exists to prevent: two
    // near-simultaneous createCharge calls for the same collectionPointId
    // must not both pass the check before either saves. The lock forces a
    // concurrent transaction to block on the check rather than race past it.
    await buildService();

    await service.createCharge(params);

    expect(repository.manager.transaction).toHaveBeenCalled();
    expect(manager.createQueryBuilder).toHaveBeenCalledWith(
      ChargeOrder,
      expect.any(String),
    );
    expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    // The check and the insert both go through the SAME manager passed into
    // the transaction callback, not the outer repository.
    expect(manager.create).toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalled();
  });

  it('scopes the busy check by collectionPointId, not by subscriptionId', async () => {
    // A future regression that scoped this check by subscriptionId instead
    // of collectionPointId would let two different members hold live orders
    // on the same physical point at once — exactly what this table exists
    // to prevent. Asserting the actual query args (not just the outcome)
    // catches that even though every other test in this file happens to
    // reuse the same subscriptionId/collectionPointId pair.
    await buildService();

    await service.createCharge(params);

    expect(queryBuilder.where).toHaveBeenCalledWith(expect.any(String), {
      collectionPointId: params.collectionPointId,
    });
    const [whereClause, whereParams] = queryBuilder.where.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const [andWhereClause, andWhereParams] = queryBuilder.andWhere.mock
      .calls[0] as [string, Record<string, unknown>];
    expect(whereClause).not.toMatch(/subscriptionId/);
    expect(andWhereClause).not.toMatch(/subscriptionId/);
    expect(whereParams).not.toHaveProperty('subscriptionId');
    expect(andWhereParams).not.toHaveProperty('subscriptionId');
  });

  it('refuses a busy collection point even when the existing order belongs to a different subscription', async () => {
    // Same rule from the other direction: a busy order for a DIFFERENT
    // member on the SAME collectionPointId must still block — the code must
    // not, say, additionally filter the found row by subscriptionId
    // client-side before deciding whether to throw.
    await buildService({
      id: 1,
      subscriptionId: 999,
      collectionPointId: params.collectionPointId,
      status: ChargeOrderStatus.PENDING,
    });

    await expect(service.createCharge(params)).rejects.toThrow(
      new ConflictException('Ya hay un cobro en curso en este punto de cobro.'),
    );
  });

  it('allows a new order once the previous one expired', async () => {
    // expireStale() has already flipped the stale order to EXPIRED by the
    // time the busy check runs, so the pessimistic-locked lookup finds
    // nothing.
    await buildService(null);

    await service.createCharge(params);

    expect(repository.update).toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalled();
  });

  it('refuses a charge against a PAUSED subscription', async () => {
    subscriptions = {
      findSubscription: jest.fn().mockResolvedValue({
        ...subscription,
        state: SubscriptionState.PAUSED,
      }),
    };
    await buildService();

    await expect(service.createCharge(params)).rejects.toThrow(
      new ConflictException('No se puede cobrar una membresía pausada.'),
    );
    expect(repository.manager.transaction).not.toHaveBeenCalled();
  });

  it('sets expiresAt from ORDER_EXPIRATION_MS', async () => {
    await buildService();
    const before = Date.now();

    await service.createCharge(params);

    const savedArg = manager.save.mock.calls[0][0] as { expiresAt: Date };
    const after = Date.now();
    expect(savedArg.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + ORDER_EXPIRATION_MS,
    );
    expect(savedArg.expiresAt.getTime()).toBeLessThanOrEqual(
      after + ORDER_EXPIRATION_MS,
    );
  });

  it('routes method=qr to the caja and method=point to the terminal', async () => {
    await buildService();

    await service.createCharge({
      ...params,
      method: 'qr',
      collectionPointId: 'caja-5',
    });

    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'qr', collectionPointId: 'caja-5' }),
    );

    manager.save.mockClear();
    await service.createCharge({
      ...params,
      method: 'point',
      collectionPointId: 'terminal-9',
    });

    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'point',
        collectionPointId: 'terminal-9',
      }),
    );
  });

  it('refuses a charge when the subscription does not exist', async () => {
    subscriptions = { findSubscription: jest.fn().mockResolvedValue(null) };
    await buildService();

    await expect(service.createCharge(params)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.manager.transaction).not.toHaveBeenCalled();
  });

  it('refuses a charge when the subscription is soft-deleted', async () => {
    subscriptions = {
      findSubscription: jest
        .fn()
        .mockResolvedValue({ ...subscription, deleted: true }),
    };
    await buildService();

    await expect(service.createCharge(params)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.manager.transaction).not.toHaveBeenCalled();
  });

  it('refuses a term that does not exist', async () => {
    planTerms = { findTerm: jest.fn().mockResolvedValue(null) };
    await buildService();

    await expect(service.createCharge(params)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.manager.transaction).not.toHaveBeenCalled();
  });

  it('refuses a term that belongs to a different plan', async () => {
    planTerms = {
      findTerm: jest.fn().mockResolvedValue({ ...term, planId: 999 }),
    };
    await buildService();

    await expect(service.createCharge(params)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.manager.transaction).not.toHaveBeenCalled();
  });

  it('builds the external reference from the subscription id', async () => {
    await buildService();

    await service.createCharge(params);

    const savedArg = manager.save.mock.calls[0][0] as {
      externalReference: string;
    };
    expect(savedArg.externalReference).toMatch(/^flg-sub-7-/);
  });

  it('creates the order with pendiente status', async () => {
    await buildService();

    await service.createCharge(params);

    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ChargeOrderStatus.PENDING }),
    );
  });
});

describe('ChargeOrderService.findByExternalReference', () => {
  let service: ChargeOrderService;
  let repository: { findOne: jest.Mock };

  beforeEach(async () => {
    repository = { findOne: jest.fn().mockResolvedValue({ id: 1 }) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChargeOrderService,
        { provide: getRepositoryToken(ChargeOrder), useValue: repository },
        { provide: subscriptionService, useValue: {} },
        { provide: PlanTermService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ChargeOrderService);
  });

  it('looks the order up by externalReference', async () => {
    const result = await service.findByExternalReference('flg-sub-7-abcd1234');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { externalReference: 'flg-sub-7-abcd1234' },
    });
    expect(result).toEqual({ id: 1 });
  });
});

describe('ChargeOrderService.findById', () => {
  let service: ChargeOrderService;
  let repository: { findOne: jest.Mock };

  beforeEach(async () => {
    repository = { findOne: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChargeOrderService,
        { provide: getRepositoryToken(ChargeOrder), useValue: repository },
        { provide: subscriptionService, useValue: {} },
        { provide: PlanTermService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ChargeOrderService);
  });

  it('looks the order up by id', async () => {
    repository.findOne.mockResolvedValue({ id: 1 });

    const result = await service.findById(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual({ id: 1 });
  });

  it('throws NotFoundException when the id does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('ChargeOrderService.setMpOrderId', () => {
  let service: ChargeOrderService;
  let repository: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn((entity: object) => Promise.resolve(entity)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChargeOrderService,
        { provide: getRepositoryToken(ChargeOrder), useValue: repository },
        { provide: subscriptionService, useValue: {} },
        { provide: PlanTermService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ChargeOrderService);
  });

  it('sets the mpOrderId on the order', async () => {
    repository.findOne.mockResolvedValue({ id: 1, mpOrderId: null });

    await service.setMpOrderId(1, 'mp-order-123');

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ mpOrderId: 'mp-order-123' }),
    );
  });

  it('throws NotFoundException when the id does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.setMpOrderId(999, 'mp-order-123'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('ChargeOrderService.closeAsPaid', () => {
  let service: ChargeOrderService;
  let repository: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn((entity: object) => Promise.resolve(entity)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChargeOrderService,
        { provide: getRepositoryToken(ChargeOrder), useValue: repository },
        { provide: subscriptionService, useValue: {} },
        { provide: PlanTermService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ChargeOrderService);
  });

  it('marks the order paid and records the paymentId', async () => {
    repository.findOne.mockResolvedValue({
      id: 1,
      externalReference: 'flg-sub-7-abcd1234',
      status: ChargeOrderStatus.PENDING,
      paymentId: null,
    });

    const result = await service.closeAsPaid('flg-sub-7-abcd1234', 42);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ChargeOrderStatus.PAID,
        paymentId: 42,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: ChargeOrderStatus.PAID,
        paymentId: 42,
      }),
    );
  });

  it('throws NotFoundException when the reference does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.closeAsPaid('missing-ref', 42)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('ChargeOrderService.closeAsError', () => {
  let service: ChargeOrderService;
  let repository: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn((entity: object) => Promise.resolve(entity)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChargeOrderService,
        { provide: getRepositoryToken(ChargeOrder), useValue: repository },
        { provide: subscriptionService, useValue: {} },
        { provide: PlanTermService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ChargeOrderService);
  });

  it('marks the order as error', async () => {
    repository.findOne.mockResolvedValue({
      id: 1,
      externalReference: 'flg-sub-7-abcd1234',
      status: ChargeOrderStatus.PENDING,
    });

    await service.closeAsError('flg-sub-7-abcd1234', 'MP rejected the order');

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ChargeOrderStatus.ERROR }),
    );
  });

  it('throws NotFoundException when the reference does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.closeAsError('missing-ref', 'whatever'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('ChargeOrderService.cancel', () => {
  let service: ChargeOrderService;
  let repository: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn((entity: object) => Promise.resolve(entity)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChargeOrderService,
        { provide: getRepositoryToken(ChargeOrder), useValue: repository },
        { provide: subscriptionService, useValue: {} },
        { provide: PlanTermService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ChargeOrderService);
  });

  it('marks the order cancelled', async () => {
    repository.findOne.mockResolvedValue({
      id: 1,
      status: ChargeOrderStatus.PENDING,
    });

    await service.cancel(1, 30111222);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ChargeOrderStatus.CANCELLED }),
    );
  });

  it('throws NotFoundException when the order does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.cancel(999, 30111222)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('ChargeOrderService.expireStale', () => {
  let service: ChargeOrderService;
  let repository: { update: jest.Mock };

  beforeEach(async () => {
    repository = { update: jest.fn().mockResolvedValue({ affected: 2 }) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChargeOrderService,
        { provide: getRepositoryToken(ChargeOrder), useValue: repository },
        { provide: subscriptionService, useValue: {} },
        { provide: PlanTermService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(ChargeOrderService);
  });

  it('bulk-updates every pendiente order past expiresAt to expirada', async () => {
    await service.expireStale();

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: ChargeOrderStatus.PENDING }),
      expect.objectContaining({ status: ChargeOrderStatus.EXPIRED }),
    );
  });
});
