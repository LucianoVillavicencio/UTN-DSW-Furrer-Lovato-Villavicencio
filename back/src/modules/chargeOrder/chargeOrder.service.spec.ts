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
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let subscriptions: { findSubscription: jest.Mock };
  let planTerms: { findTerm: jest.Mock };

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

  const buildService = async () => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      findOne: jest.fn().mockResolvedValue(null),
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

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ amount: term.price }),
    );
  });

  it('refuses a second order on a collection point that is busy', async () => {
    await buildService();
    repository.findOne.mockResolvedValue({
      id: 1,
      collectionPointId: 'terminal-1',
      status: ChargeOrderStatus.PENDING,
    });

    await expect(service.createCharge(params)).rejects.toThrow(
      new ConflictException('Ya hay un cobro en curso en este punto de cobro.'),
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows a new order once the previous one expired', async () => {
    await buildService();
    // expireStale() has already flipped the stale order to EXPIRED by the
    // time the busy check runs, so the busy-point lookup finds nothing.
    repository.findOne.mockResolvedValue(null);

    await service.createCharge(params);

    expect(repository.update).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
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
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('sets expiresAt from ORDER_EXPIRATION_MS', async () => {
    await buildService();
    const before = Date.now();

    await service.createCharge(params);

    const savedArg = repository.save.mock.calls[0][0] as { expiresAt: Date };
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

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'qr', collectionPointId: 'caja-5' }),
    );

    repository.save.mockClear();
    await service.createCharge({
      ...params,
      method: 'point',
      collectionPointId: 'terminal-9',
    });

    expect(repository.save).toHaveBeenCalledWith(
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
    expect(repository.save).not.toHaveBeenCalled();
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
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('refuses a term that does not exist', async () => {
    planTerms = { findTerm: jest.fn().mockResolvedValue(null) };
    await buildService();

    await expect(service.createCharge(params)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('refuses a term that belongs to a different plan', async () => {
    planTerms = {
      findTerm: jest.fn().mockResolvedValue({ ...term, planId: 999 }),
    };
    await buildService();

    await expect(service.createCharge(params)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('builds the external reference from the subscription id', async () => {
    await buildService();

    await service.createCharge(params);

    const savedArg = repository.save.mock.calls[0][0] as {
      externalReference: string;
    };
    expect(savedArg.externalReference).toMatch(/^flg-sub-7-/);
  });

  it('creates the order with pendiente status', async () => {
    await buildService();

    await service.createCharge(params);

    expect(repository.save).toHaveBeenCalledWith(
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
