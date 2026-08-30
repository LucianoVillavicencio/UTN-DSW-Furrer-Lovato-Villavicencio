import { ChargeOrderResolverAdapter } from './chargeOrder-resolver.adapter';
import { ChargeOrderStatus } from './enum/chargeOrder-status.enum';

describe('ChargeOrderResolverAdapter.resolve', () => {
  let chargeOrderService: {
    findByExternalReference: jest.Mock;
    closeAsPaid: jest.Mock;
  };
  let adapter: ChargeOrderResolverAdapter;

  const pendingOrder = {
    id: 1,
    subscriptionId: 7,
    planTermId: 55,
    planTerm: { id: 55, months: 3 },
    method: 'qr' as const,
    externalReference: 'flg-sub-7-abcd1234',
    amount: 15000,
    status: ChargeOrderStatus.PENDING,
    createdById: 30111222,
  };

  beforeEach(() => {
    chargeOrderService = {
      findByExternalReference: jest.fn(),
      closeAsPaid: jest.fn().mockResolvedValue(undefined),
    };
    adapter = new ChargeOrderResolverAdapter(chargeOrderService as never);
  });

  it('maps a pendiente order to a ResolvedOrder', async () => {
    chargeOrderService.findByExternalReference.mockResolvedValue(pendingOrder);

    const result = await adapter.resolve('flg-sub-7-abcd1234');

    expect(result).toEqual({
      subscriptionId: 7,
      amount: 15000,
      termMonths: 3,
      payMethod: 'qr',
      registeredById: 30111222,
    });
  });

  it('returns null when no order matches the external reference', async () => {
    chargeOrderService.findByExternalReference.mockResolvedValue(null);

    const result = await adapter.resolve('unknown-ref');

    expect(result).toBeNull();
  });

  it.each([
    ChargeOrderStatus.PAID,
    ChargeOrderStatus.CANCELLED,
    ChargeOrderStatus.EXPIRED,
    ChargeOrderStatus.ERROR,
  ])(
    'returns null for a %s order instead of re-resolving it',
    async (status) => {
      chargeOrderService.findByExternalReference.mockResolvedValue({
        ...pendingOrder,
        status,
      });

      const result = await adapter.resolve('flg-sub-7-abcd1234');

      expect(result).toBeNull();
    },
  );
});

describe('ChargeOrderResolverAdapter.close', () => {
  it('delegates to chargeOrderService.closeAsPaid', async () => {
    const chargeOrderService = {
      findByExternalReference: jest.fn(),
      closeAsPaid: jest.fn().mockResolvedValue(undefined),
    };
    const adapter = new ChargeOrderResolverAdapter(chargeOrderService as never);

    await adapter.close('flg-sub-7-abcd1234', 42);

    expect(chargeOrderService.closeAsPaid).toHaveBeenCalledWith(
      'flg-sub-7-abcd1234',
      42,
    );
  });
});
