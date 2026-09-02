import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { ReceiptPrint } from './entity/receipt-print.entity';
import {
  buildReceiptHtml,
  buildCredentialsHtml,
  type ReceiptPayMethod,
  type CredentialsPayload,
} from './receipt.html';
import { renderReceiptToJpegBuffer } from './receipt.render';
import { MercadoPagoTerminalPrinterClient } from '../mercadopago/mercadopago-printer.client';

export type ReceiptDocumentType = 'payment' | 'credentials';

export interface PrintPaymentReceiptInput {
  paymentId: number;
  amount: number;
  date: Date;
  payMethod: ReceiptPayMethod;
  terminalId: string;
  cashier?: string;
  storeName?: string;
}

export type PrintCredentialsSlipInput = CredentialsPayload & {
  userId: number;
  terminalId: string;
};

export interface PrintPaymentReceiptResult {
  status: 'sent' | 'error';
  errorMessage?: string;
}

/**
 * Renders and prints a document on a Point terminal — the informational
 * "cash/transferencia" payment ticket or a member's credentials slip — and
 * logs the attempt for dedupe. Never throws — this is a side effect of an
 * already-persisted row (a Payment or a Users), so a printing failure must
 * never look like that row's creation failed. Callers surface `status` to
 * the admin instead.
 */
@Injectable()
export class ReceiptPrintService {
  private readonly logger = new Logger(ReceiptPrintService.name);

  constructor(
    @InjectRepository(ReceiptPrint)
    private readonly repository: Repository<ReceiptPrint>,
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

    return this.printDocument({
      documentType: 'payment',
      documentId: input.paymentId,
      terminalId: input.terminalId,
      html,
    });
  }

  /**
   * Prints a member's credentials slip. Same never-throws contract as
   * printPaymentReceipt: the account already exists, so a printing failure
   * must never look like the member was not created.
   */
  async printCredentialsSlip(
    input: PrintCredentialsSlipInput,
  ): Promise<PrintPaymentReceiptResult> {
    return this.printDocument({
      documentType: 'credentials',
      documentId: input.userId,
      terminalId: input.terminalId,
      html: buildCredentialsHtml(input),
    });
  }

  private async printDocument({
    documentType,
    documentId,
    terminalId,
    html,
  }: {
    documentType: ReceiptDocumentType;
    documentId: number;
    terminalId: string;
    html: string;
  }): Promise<PrintPaymentReceiptResult> {
    let buffer: Buffer;
    try {
      buffer = await renderReceiptToJpegBuffer(html);
    } catch (err) {
      return this.fail(documentType, documentId, terminalId, '', err);
    }

    const contentHash = createHash('sha256').update(buffer).digest('hex');

    // A retry of the same document (admin double-click, front-end retry)
    // that already produced this exact ticket must not print it twice.
    const alreadySent = await this.repository
      .findOne({
        where: { documentType, documentId, contentHash, status: 'sent' },
      })
      .catch(() => null);
    if (alreadySent) {
      return { status: 'sent' };
    }

    const externalReference = `receipt-${documentType}-${documentId}`;
    const idempotencyKey = randomUUID();

    let actionId: string | null = null;
    let actionStatus: string | null = null;
    try {
      const result = await this.printerClient.printReceiptImage({
        terminalId,
        externalReference,
        idempotencyKey,
        imageBuffer: buffer,
      });
      actionId = result.actionId ?? null;
      actionStatus = result.status ?? null;
    } catch (err) {
      return this.fail(
        documentType,
        documentId,
        terminalId,
        contentHash,
        err,
        externalReference,
        idempotencyKey,
      );
    }

    await this.persist({
      documentType,
      documentId,
      terminalId,
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
    documentType: ReceiptDocumentType,
    documentId: number,
    terminalId: string,
    contentHash: string,
    err: unknown,
    externalReference = `receipt-${documentType}-${documentId}`,
    idempotencyKey = randomUUID(),
  ): Promise<PrintPaymentReceiptResult> {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.warn(
      `Failed to print receipt for ${documentType} ${documentId}: ${errorMessage}`,
    );
    await this.persist({
      documentType,
      documentId,
      terminalId,
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
    documentType: ReceiptDocumentType;
    documentId: number;
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
        `Failed to persist receipt print record for ${row.documentType} ${row.documentId}: ${detail}`,
      );
    }
  }
}
