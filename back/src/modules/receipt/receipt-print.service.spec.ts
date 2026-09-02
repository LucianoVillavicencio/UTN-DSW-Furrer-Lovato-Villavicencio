import { ReceiptPrintService } from './receipt-print.service';
import { MercadoPagoTerminalPrinterClient } from '../mercadopago/mercadopago-printer.client';
import { renderReceiptToJpegBuffer } from './receipt.render';

jest.mock('./receipt.render', () => ({
  renderReceiptToJpegBuffer: jest.fn(),
}));

const mockedRender = renderReceiptToJpegBuffer as jest.Mock;

describe('ReceiptPrintService.printPaymentReceipt', () => {
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let printerClient: { printReceiptImage: jest.Mock };
  let service: ReceiptPrintService;

  const input = {
    paymentId: 42,
    amount: 19995,
    date: new Date('2026-09-01T14:30:00Z'),
    payMethod: 'efectivo' as const,
    terminalId: 'terminal-1',
    cashier: 'admin@flg.test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      findOne: jest.fn().mockResolvedValue(null),
    };
    printerClient = { printReceiptImage: jest.fn() };
    mockedRender.mockResolvedValue(Buffer.from('fake-jpeg-bytes'));
    service = new ReceiptPrintService(
      repository as never,
      printerClient as unknown as MercadoPagoTerminalPrinterClient,
    );
  });

  it('prints and persists a "sent" row on the happy path, including Mercado Pago\'s action id', async () => {
    printerClient.printReceiptImage.mockResolvedValue({
      idempotencyKey: 'idem-1',
      actionId: 'action-1',
      status: 'created',
      responseBody: { id: 'action-1', status: 'created' },
    });

    const result = await service.printPaymentReceipt(input);

    expect(result).toEqual({ status: 'sent' });
    expect(printerClient.printReceiptImage).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalId: 'terminal-1',
        externalReference: 'receipt-payment-42',
        imageBuffer: Buffer.from('fake-jpeg-bytes'),
      }),
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        documentType: 'payment',
        documentId: 42,
        status: 'sent',
        externalReference: 'receipt-payment-42',
        actionId: 'action-1',
        actionStatus: 'created',
      }),
    );
  });

  it('never sends PII in externalReference', async () => {
    printerClient.printReceiptImage.mockResolvedValue({
      idempotencyKey: 'idem-1',
      responseBody: {},
    });

    await service.printPaymentReceipt(input);

    const calls = printerClient.printReceiptImage.mock.calls as Array<
      [{ externalReference: string }]
    >;
    const [call] = calls[0];
    expect(call.externalReference).not.toMatch(/admin@flg\.test/);
    expect(call.externalReference).toBe('receipt-payment-42');
  });

  it('skips a re-print when the same ticket already printed successfully', async () => {
    repository.findOne.mockResolvedValue({
      id: 5,
      documentType: 'payment',
      documentId: 42,
      status: 'sent',
    });

    const result = await service.printPaymentReceipt(input);

    expect(result).toEqual({ status: 'sent' });
    expect(printerClient.printReceiptImage).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('dedupes on the document identity, not the payment alone', async () => {
    repository.findOne.mockResolvedValue({ id: 1, status: 'sent' });

    await service.printPaymentReceipt(input);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        documentType: 'payment',
        documentId: 42,
        contentHash: expect.any(String),
        status: 'sent',
      },
    });
  });

  it('builds an external reference that carries no PII', async () => {
    await service.printPaymentReceipt(input);

    const [call] = printerClient.printReceiptImage.mock.calls as [
      [{ externalReference: string }],
    ];
    expect(call[0].externalReference).toBe('receipt-payment-42');
  });

  it('persists an "error" row and returns it when rendering fails, without calling the printer', async () => {
    mockedRender.mockRejectedValue(new Error('chromium crashed'));

    const result = await service.printPaymentReceipt(input);

    expect(result).toEqual({
      status: 'error',
      errorMessage: 'chromium crashed',
    });
    expect(printerClient.printReceiptImage).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        documentType: 'payment',
        documentId: 42,
        status: 'error',
        errorMessage: 'chromium crashed',
      }),
    );
  });

  it('persists an "error" row and returns it when the terminal call fails', async () => {
    printerClient.printReceiptImage.mockRejectedValue(
      new Error(
        'Mercado Pago terminal print failed (status=400): bad terminal',
      ),
    );

    const result = await service.printPaymentReceipt(input);

    expect(result).toEqual({
      status: 'error',
      errorMessage:
        'Mercado Pago terminal print failed (status=400): bad terminal',
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        documentType: 'payment',
        documentId: 42,
        status: 'error',
        actionId: null,
      }),
    );
  });

  it('never throws, even when both rendering and persistence fail', async () => {
    mockedRender.mockRejectedValue(new Error('render exploded'));
    repository.save.mockRejectedValue(new Error('db down'));

    await expect(service.printPaymentReceipt(input)).resolves.toBeDefined();
  });
});

describe('ReceiptPrintService.printCredentialsSlip', () => {
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let printerClient: { printReceiptImage: jest.Mock };
  let service: ReceiptPrintService;

  const input = {
    userId: 7,
    memberName: 'Rosa Gomez',
    dni: 40123456,
    username: '40123456@presencial.flg',
    password: 'krtm4829',
    terminalId: 'terminal-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      findOne: jest.fn().mockResolvedValue(null),
    };
    printerClient = { printReceiptImage: jest.fn() };
    mockedRender.mockResolvedValue(Buffer.from('fake-jpeg-bytes'));
    service = new ReceiptPrintService(
      repository as never,
      printerClient as unknown as MercadoPagoTerminalPrinterClient,
    );
  });

  it('builds an external reference keyed on the user, not the payment', async () => {
    printerClient.printReceiptImage.mockResolvedValue({
      idempotencyKey: 'idem-1',
      responseBody: {},
    });

    const result = await service.printCredentialsSlip(input);

    expect(result).toEqual({ status: 'sent' });
    expect(printerClient.printReceiptImage).toHaveBeenCalledWith(
      expect.objectContaining({ externalReference: 'receipt-credentials-7' }),
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        documentType: 'credentials',
        documentId: 7,
        status: 'sent',
      }),
    );
  });
});
