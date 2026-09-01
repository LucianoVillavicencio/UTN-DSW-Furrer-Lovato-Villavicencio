import { Logger } from '@nestjs/common';
import {
  WebhookService,
  OrderResolver,
  ResolvedOrder,
} from './webhook.service';

describe('WebhookService.handleNotification', () => {
  let client: { getPayment: jest.Mock; getOrder: jest.Mock };
  let orderResolver: OrderResolver & { resolve: jest.Mock; close: jest.Mock };
  let paymentService: {
    findByMpPaymentId: jest.Mock;
    createFromMercadoPago: jest.Mock;
  };
  let subscriptionService: { findSubscription: jest.Mock };
  let mailService: { sendPaymentReceipt: jest.Mock };
  let service: WebhookService;

  const resolvedOrder: ResolvedOrder = {
    subscriptionId: 7,
    amount: 15000,
    termMonths: 1,
    payMethod: 'mercadopago',
  };

  const subscriptionRow = {
    id: 7,
    endDate: '2026-09-27',
    user: { email: 'member@example.com', name: 'Ana' },
    plan: { name: 'Mensual' },
  };

  const buildService = () => {
    service = new WebhookService(
      client as never,
      orderResolver,
      paymentService as never,
      subscriptionService as never,
      mailService as never,
    );
  };

  beforeEach(() => {
    client = { getPayment: jest.fn(), getOrder: jest.fn() };
    orderResolver = {
      resolve: jest.fn().mockResolvedValue(resolvedOrder),
      close: jest.fn().mockResolvedValue(undefined),
    };
    paymentService = {
      findByMpPaymentId: jest.fn().mockResolvedValue(null),
      createFromMercadoPago: jest.fn().mockResolvedValue({ id: 1 }),
    };
    subscriptionService = {
      findSubscription: jest.fn().mockResolvedValue(subscriptionRow),
    };
    mailService = {
      sendPaymentReceipt: jest.fn().mockResolvedValue(undefined),
    };
    buildService();
  });

  // MP retries at 0, 15min, 30min, 6h, 48h, 96h... a non-2xx for "already
  // handled" would earn four days of pointless retries — so this must
  // resolve normally (200), not throw, while writing nothing new.
  it('answers 200 and writes nothing for a payment it already recorded', async () => {
    client.getPayment.mockResolvedValue({
      id: 'mp-already',
      status: 'approved',
      transactionAmount: 15000,
      externalReference: 'order-1',
    });
    paymentService.findByMpPaymentId.mockResolvedValue({ id: 999 });
    // The order was already closed by the delivery that recorded the payment,
    // so resolve() reports nothing left to do (its own status check).
    orderResolver.resolve.mockResolvedValue(null);

    await expect(
      service.handleNotification('mp-already'),
    ).resolves.toBeUndefined();

    expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
    expect(mailService.sendPaymentReceipt).not.toHaveBeenCalled();
    // resolve() IS consulted — it is the idempotent probe for "does this
    // order still need closing" — but with the order already closed there is
    // nothing to close a second time.
    expect(orderResolver.close).not.toHaveBeenCalled();
  });

  // The stuck-order recovery path. If a prior delivery wrote the Payment and
  // then failed inside close(), every later retry would short-circuit on the
  // idempotency check and never close the order — it would sit 'pendiente',
  // blocking its collection point, until expireStale timed it out.
  describe('retry after a Payment was recorded but the order never closed', () => {
    beforeEach(() => {
      client.getPayment.mockResolvedValue({
        id: 'mp-stuck',
        status: 'approved',
        transactionAmount: 15000,
        externalReference: 'order-1',
      });
      paymentService.findByMpPaymentId.mockResolvedValue({ id: 999 });
    });

    it('closes the order using the already-recorded payment id', async () => {
      // resolve() returns non-null only while the order is still 'pendiente'.
      orderResolver.resolve.mockResolvedValue(resolvedOrder);

      await service.handleNotification('mp-stuck');

      expect(orderResolver.resolve).toHaveBeenCalledWith('order-1');
      expect(orderResolver.close).toHaveBeenCalledWith('order-1', 999);
      // Still no second Payment row and no second receipt.
      expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
      expect(mailService.sendPaymentReceipt).not.toHaveBeenCalled();
    });

    it('does not close an order that is already closed', async () => {
      orderResolver.resolve.mockResolvedValue(null);

      await service.handleNotification('mp-stuck');

      expect(orderResolver.close).not.toHaveBeenCalled();
    });

    it('does not throw when close() fails again on the retry', async () => {
      // Throwing here would only earn another MP retry that lands right back
      // on this branch — the Payment is already durably recorded either way.
      orderResolver.resolve.mockResolvedValue(resolvedOrder);
      orderResolver.close.mockRejectedValue(new Error('connection lost'));
      const warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      await expect(
        service.handleNotification('mp-stuck'),
      ).resolves.toBeUndefined();

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Retry could not close the order'),
      );
      warn.mockRestore();
    });
  });

  // handleNotification's only parameter is the already-verified dataId —
  // there is no code path here that reads a status or amount from anywhere
  // other than client.getPayment's response. This pins that the re-fetched
  // result is what governs, exactly as it must if a delivery's own claimed
  // status/amount (approved / 50000, say) disagreed with what Mercado Pago's
  // API actually reports for that payment (rejected / 100 here).
  it('re-fetches the payment from the API instead of trusting the body', async () => {
    client.getPayment.mockResolvedValue({
      id: 'mp-mismatch',
      status: 'rejected',
      transactionAmount: 100,
      externalReference: 'order-1',
    });

    await service.handleNotification('mp-mismatch');

    expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
  });

  it('refuses a payment whose amount does not match the order snapshot', async () => {
    client.getPayment.mockResolvedValue({
      id: 'mp-underpaid',
      status: 'approved',
      transactionAmount: 100,
      externalReference: 'order-1',
    });
    orderResolver.resolve.mockResolvedValue(resolvedOrder); // amount: 15000

    await service.handleNotification('mp-underpaid');

    expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
    expect(mailService.sendPaymentReceipt).not.toHaveBeenCalled();
    expect(orderResolver.close).not.toHaveBeenCalled();
  });

  it('records an approved payment and activates the subscription', async () => {
    client.getPayment.mockResolvedValue({
      id: 'mp-ok',
      status: 'approved',
      transactionAmount: 15000,
      externalReference: 'order-1',
    });

    await service.handleNotification('mp-ok');

    expect(orderResolver.resolve).toHaveBeenCalledWith('order-1');
    // Activation itself is PaymentService's job (already covered by its own
    // spec) — what this asserts is that the webhook hands it exactly the
    // resolved order snapshot plus the re-fetched mpPaymentId, which is what
    // drives that activation/renewal.
    expect(paymentService.createFromMercadoPago).toHaveBeenCalledWith({
      mpPaymentId: 'mp-ok',
      subscriptionId: 7,
      amount: 15000,
      termMonths: 1,
      payMethod: 'mercadopago',
      registeredById: null,
    });
    // Closes the resolver's own bookkeeping (ChargeOrder -> 'pagada' for the
    // real adapter) using the just-created Payment's id, not the MP payment
    // id — and only once the write has actually succeeded.
    expect(orderResolver.close).toHaveBeenCalledWith('order-1', 1);
    expect(mailService.sendPaymentReceipt).toHaveBeenCalledWith({
      to: 'member@example.com',
      name: 'Ana',
      planName: 'Mensual',
      amount: 15000,
      termMonths: 1,
      method: 'mercadopago',
      newEndDate: '2026-09-27',
    });
  });

  // A front-desk charge order resolves with a registeredById (the admin who
  // started it); an online renewal's resolved order has none. Both must flow
  // through to the Payment write untouched.
  it("passes the resolved order's registeredById through to the payment write", async () => {
    client.getPayment.mockResolvedValue({
      id: 'mp-front-desk',
      status: 'approved',
      transactionAmount: 15000,
      externalReference: 'order-1',
    });
    orderResolver.resolve.mockResolvedValue({
      ...resolvedOrder,
      registeredById: 30111222,
    });

    await service.handleNotification('mp-front-desk');

    expect(paymentService.createFromMercadoPago).toHaveBeenCalledWith(
      expect.objectContaining({ registeredById: 30111222 }),
    );
  });

  it('answers 200 for a status it does not act on, such as in_process', async () => {
    client.getPayment.mockResolvedValue({
      id: 'mp-pending',
      status: 'in_process',
      transactionAmount: 15000,
      externalReference: 'order-1',
    });

    await expect(
      service.handleNotification('mp-pending'),
    ).resolves.toBeUndefined();

    expect(paymentService.findByMpPaymentId).not.toHaveBeenCalled();
    expect(orderResolver.resolve).not.toHaveBeenCalled();
    expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
  });

  // The placeholder OrderResolver bound in MercadoPagoWebhookModule always
  // resolves null — this is what makes that safe: an unresolvable order is
  // a no-op, not a crash.
  it('answers 200 and writes nothing when the order cannot be resolved', async () => {
    client.getPayment.mockResolvedValue({
      id: 'mp-unresolved',
      status: 'approved',
      transactionAmount: 15000,
      externalReference: 'order-unknown',
    });
    orderResolver.resolve.mockResolvedValue(null);

    await expect(
      service.handleNotification('mp-unresolved'),
    ).resolves.toBeUndefined();

    expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
    expect(orderResolver.close).not.toHaveBeenCalled();
  });

  // Point/QR front-desk charges are created via the Orders API
  // (MercadoPagoClient.createOrder), so Mercado Pago notifies them under the
  // `order` topic with an ORDER id, not a legacy Payments API payment id —
  // a completely different resource namespace. Passing that id to
  // getPayment (the `payment`-topic path above) 404s in production; this
  // describe block exercises the getOrder-based path instead.
  describe('an order-topic notification (Point/QR front-desk charges)', () => {
    it('records an approved order and activates the subscription', async () => {
      client.getOrder.mockResolvedValue({
        id: 'ORD01',
        status: 'processed',
        statusDetail: 'accredited',
        totalPaidAmount: 15000,
        externalReference: 'order-1',
        paymentId: 'PAY01',
      });

      await service.handleNotification('ORD01', 'order');

      expect(client.getOrder).toHaveBeenCalledWith('ORD01');
      expect(client.getPayment).not.toHaveBeenCalled();
      expect(orderResolver.resolve).toHaveBeenCalledWith('order-1');
      expect(paymentService.createFromMercadoPago).toHaveBeenCalledWith({
        mpPaymentId: 'PAY01',
        subscriptionId: 7,
        amount: 15000,
        termMonths: 1,
        payMethod: 'mercadopago',
        registeredById: null,
      });
      expect(orderResolver.close).toHaveBeenCalledWith('order-1', 1);
    });

    it('answers 200 for an order status it does not act on, such as created', async () => {
      client.getOrder.mockResolvedValue({
        id: 'ORD02',
        status: 'created',
        totalPaidAmount: 15000,
        externalReference: 'order-1',
        paymentId: 'PAY02',
      });

      await expect(
        service.handleNotification('ORD02', 'order'),
      ).resolves.toBeUndefined();

      expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
    });

    it('answers 200 and writes nothing for an order with no transaction yet', async () => {
      client.getOrder.mockResolvedValue({
        id: 'ORD03',
        status: 'created',
        externalReference: 'order-1',
        paymentId: undefined,
      });

      await expect(
        service.handleNotification('ORD03', 'order'),
      ).resolves.toBeUndefined();

      expect(orderResolver.resolve).not.toHaveBeenCalled();
      expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
    });
  });

  it('answers 200 and writes nothing for an unhandled notification topic', async () => {
    await expect(
      service.handleNotification('some-id', 'merchant_order'),
    ).resolves.toBeUndefined();

    expect(client.getPayment).not.toHaveBeenCalled();
    expect(client.getOrder).not.toHaveBeenCalled();
    expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
  });
});
