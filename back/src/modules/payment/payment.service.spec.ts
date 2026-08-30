import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
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
        { provide: subscriptionService, useValue: {} },
        { provide: UserService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(PaymentService);
  };

  it('attaches the recording admin name to a payment with registeredById', async () => {
    repository = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 1, registeredById: 30111222 }]),
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
