import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { PaymentReceiptPrint } from './entity/payment-receipt-print.entity';
import { buildReceiptHtml, type ReceiptPayMethod } from './receipt.html';
import { renderReceiptToJpegBuffer } from './receipt.render';
import { MercadoPagoTerminalPrinterClient } from '../mercadopago/mercadopago-printer.client';

export interface PrintPaymentReceiptInput {
  paymentId: number;
  amount: number;
  date: Date;
  payMethod: ReceiptPayMethod;
  terminalId: string;
  cashier?: string;
  storeName?: string;
}

export interface PrintPaymentReceiptResult {
  status: 'sent' | 'error';
  errorMessage?: string;
}

/**
 * Renders and prints the informational "cash/transferencia" ticket on a
 * Point terminal, and logs the attempt for dedupe. Never throws — this is a
 * side effect of an already-persisted Payment, so a printing failure must
 * never look like the payment itself failed. Callers surface `status` to
 * the admin instead.
 */
@Injectable()
export class ReceiptPrintService {
  private readonly logger = new Logger(ReceiptPrintService.name);

  constructor(
    @InjectRepository(PaymentReceiptPrint)
    private readonly repository: Repository<PaymentReceiptPrint>,
    private readonly printerClient: MercadoPagoTerminalPrinterClient,
  ) {}

  async printPaymentReceipt(
    input: PrintPaymentReceiptInput,
  ): Promise<PrintPaymentReceiptResult> {
    const html = buildReceiptHtml({
      orderId: input.paymentId,
      amount: input.amount,
      dateTime: input.date,
      payMethod: input.payMethod,
      cashier: input.cashier,
      storeName: input.storeName,
    });

    let buffer: Buffer;
    try {
      buffer = await renderReceiptToJpegBuffer(html);
    } catch (err) {
      return this.fail(input, '', err);
    }

    const contentHash = createHash('sha256').update(buffer).digest('hex');

    // A retry of the same payment (admin double-click, front-end retry)
    // that already produced this exact ticket must not print it twice.
    const alreadySent = await this.repository
      .findOne({
        where: { paymentId: input.paymentId, contentHash, status: 'sent' },
      })
      .catch(() => null);
    if (alreadySent) {
      return { status: 'sent' };
    }

    const externalReference = `receipt-payment-${input.paymentId}`;
    const idempotencyKey = randomUUID();

    let actionId: string | null = null;
    let actionStatus: string | null = null;
    try {
      const result = await this.printerClient.printReceiptImage({
        terminalId: input.terminalId,
        externalReference,
        idempotencyKey,
        imageBuffer: buffer,
      });
      actionId = result.actionId ?? null;
      actionStatus = result.status ?? null;
    } catch (err) {
      return this.fail(
        input,
        contentHash,
        err,
        externalReference,
        idempotencyKey,
      );
    }

    await this.persist({
      paymentId: input.paymentId,
      terminalId: input.terminalId,
      externalReference,
      idempotencyKey,
      actionId,
      actionStatus,
      contentHash,
      status: 'sent',
      errorMessage: null,
    });
    return { status: 'sent' };
  }

  private async fail(
    input: PrintPaymentReceiptInput,
    contentHash: string,
    err: unknown,
    externalReference = `receipt-payment-${input.paymentId}`,
    idempotencyKey = randomUUID(),
  ): Promise<PrintPaymentReceiptResult> {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.warn(
      `Failed to print receipt for payment ${input.paymentId}: ${errorMessage}`,
    );
    await this.persist({
      paymentId: input.paymentId,
      terminalId: input.terminalId,
      externalReference,
      idempotencyKey,
      actionId: null,
      actionStatus: null,
      contentHash,
      status: 'error',
      errorMessage,
    });
    return { status: 'error', errorMessage };
  }

  private async persist(row: {
    paymentId: number;
    terminalId: string;
    externalReference: string;
    idempotencyKey: string;
    actionId: string | null;
    actionStatus: string | null;
    contentHash: string;
    status: 'sent' | 'error';
    errorMessage: string | null;
  }): Promise<void> {
    try {
      await this.repository.save(
        this.repository.create({ ...row, createdAt: new Date() }),
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to persist receipt print record for payment ${row.paymentId}: ${detail}`,
      );
    }
  }
}
