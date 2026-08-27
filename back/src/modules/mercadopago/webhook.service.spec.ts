import {
  WebhookService,
  OrderResolver,
  ResolvedOrder,
} from './webhook.service';

describe('WebhookService.handleNotification', () => {
  let client: { getPayment: jest.Mock };
  let orderResolver: OrderResolver & { resolve: jest.Mock };
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
    client = { getPayment: jest.fn() };
    orderResolver = { resolve: jest.fn().mockResolvedValue(resolvedOrder) };
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

    await expect(
      service.handleNotification('mp-already'),
    ).resolves.toBeUndefined();

    expect(paymentService.createFromMercadoPago).not.toHaveBeenCalled();
    expect(mailService.sendPaymentReceipt).not.toHaveBeenCalled();
    // Short-circuits before even trying to resolve an order for it.
    expect(orderResolver.resolve).not.toHaveBeenCalled();
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
  });
});
