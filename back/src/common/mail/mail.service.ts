import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Format a Date or YYYY-MM-DD string as DD/MM/YYYY.
   * If input is a string already in YYYY-MM-DD format, just reformat directly
   * to avoid timezone shifts. If it's a Date, use local getters.
   */
  private formatDateDDMMYYYY(date: Date | string): string {
    if (typeof date === 'string') {
      // Assume YYYY-MM-DD format
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }
    // Date object: use local date parts
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendContactNotification(data: {
    name: string;
    surname: string;
    email: string;
    message: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `Formulario FLG <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        replyTo: data.email,
        subject: `Nueva consulta de contacto: ${data.name} ${data.surname}`,
        text: `Nombre: ${data.name} ${data.surname}\nEmail: ${data.email}\n\nMensaje:\n ${data.message}`,
        html: `
                <h3>Nueva consulta desde el formulario de contacto de FLG</h3>
                <p><strong>Nombre:</strong> ${data.name} ${data.surname}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${data.message.replace(/\n/g, '<br>')}</p>
                `,
      });
    } catch (error) {
      this.logger.error(`Error al enviar el email de contacto`, error);
    }
  }

  async sendPasswordReset(data: {
    to: string;
    name: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<void> {
    try {
      const text = `Hola ${data.name},\n\nRecibimos una solicitud para restablecer la contraseña de tu cuenta de FLG.\n\nPara elegir una nueva, ingresa a este enlace (vence en ${data.expiresInMinutes} minutos y se puede usar una sola vez):\n${data.resetUrl}\n\nSi no fuiste tú, ignora este correo: tu contraseña actual sigue funcionando.\n\nEl equipo de FLG.`;

      // Email clients ignore <style> blocks and most modern CSS, so the layout
      // is tables with inline styles. Colors follow the site's palette
      // (front/src/index.css). The name is member-typed, hence the escape.
      const name = this.escapeHtml(data.name);
      const url = this.escapeHtml(data.resetUrl);
      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>Restablecer tu contraseña</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Elige una nueva contraseña para tu cuenta de FLG. El enlace vence en ${data.expiresInMinutes} minutos.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050505" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:24px;font-family:Poppins,Arial,sans-serif;font-size:26px;font-weight:800;letter-spacing:1px;color:#ffffff;">
              FL<span style="color:#22c55e;">G</span>
            </td>
          </tr>
          <tr>
            <td bgcolor="#0a0a0a" style="background-color:#0a0a0a;border:1px solid #262626;border-radius:16px;border-top:4px solid #22c55e;padding:40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <div style="width:56px;height:56px;line-height:56px;border-radius:14px;background-color:#0f2a19;border:1px solid #1d5e35;font-size:26px;text-align:center;">&#128273;</div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:Poppins,Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;padding-bottom:8px;">
                    Restablece tu contraseña
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:24px;color:#a3a3a3;padding-bottom:28px;">
                    Hola <strong style="color:#ffffff;">${name}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta de FLG.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#22c55e" style="border-radius:10px;background-color:#22c55e;">
                          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Poppins,Arial,sans-serif;font-size:15px;font-weight:600;color:#050505;text-decoration:none;border-radius:10px;">
                            Elegir nueva contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#141414;border:1px solid #262626;border-radius:10px;padding:14px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:#a3a3a3;">
                    &#9201;&nbsp; El enlace vence en <strong style="color:#ffffff;">${data.expiresInMinutes} minutos</strong> y se puede usar una sola vez.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:#a3a3a3;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                    <a href="${url}" target="_blank" style="color:#22c55e;word-break:break-all;">${url}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding-top:20px;border-top:1px solid #262626;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:#737373;">
                    Si no fuiste tú, ignora este correo: tu contraseña actual sigue funcionando.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#525252;">
              El equipo de FLG &middot; Este es un correo automático, no respondas a este mensaje.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await this.transporter.sendMail({
        from: `FLG <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: `Restablecer tu contraseña — FLG`,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(`Error al enviar el email de recuperación`, error);
    }
  }

  async sendPaymentReceipt(data: {
    to: string;
    name: string;
    planName: string;
    amount: number;
    // null marks a prorated plan-change payment — it buys no term, so there
    // is no month count to show. The caller (CheckoutService.settle) passes
    // null exactly when charge.termMonths is 0, never a bare 0/undefined
    // here, so this template never has to guess.
    termMonths: number | null;
    method: string;
    newEndDate: Date | string;
  }): Promise<void> {
    try {
      const formattedAmount = `$${data.amount.toLocaleString('es-AR')}`;
      const formattedEndDate = this.formatDateDDMMYYYY(data.newEndDate);
      const durationLine =
        data.termMonths === null
          ? 'Ajuste de plan'
          : `${data.termMonths} ${data.termMonths === 1 ? 'mes' : 'meses'}`;
      const text = `Hola ${data.name},\n\nTe enviamos tu recibo de pago:\n\nMonto: ${formattedAmount}\nPlan: ${data.planName}\nDuración: ${durationLine}\nMétodo de pago: ${data.method}\nNueva fecha de vencimiento: ${formattedEndDate}\n\nGracias por tu confianza en FLG.`;

      const html = `
                <h3>Recibo de pago — FLG</h3>
                <p>Hola <strong>${data.name}</strong>,</p>
                <p>Te enviamos tu recibo de pago:</p>
                <ul>
                  <li><strong>Monto:</strong> ${formattedAmount}</li>
                  <li><strong>Plan:</strong> ${data.planName}</li>
                  <li><strong>Duración:</strong> ${durationLine}</li>
                  <li><strong>Método de pago:</strong> ${data.method}</li>
                  <li><strong>Nueva fecha de vencimiento:</strong> ${formattedEndDate}</li>
                </ul>
                <p>Gracias por tu confianza en FLG.</p>
                `;

      await this.transporter.sendMail({
        from: `FLG <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: `Recibo de pago — FLG`,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(`Error al enviar el recibo de pago`, error);
    }
  }

  async sendRenewalFailure(data: {
    to: string;
    name: string;
    planName: string;
    endDate: Date | string;
    isFinalAttempt: boolean;
  }): Promise<void> {
    try {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      const formattedEndDate = this.formatDateDDMMYYYY(data.endDate);

      if (!data.isFinalAttempt) {
        // Retry attempt
        const text = `Hola ${data.name},\n\nNo pudimos procesar el pago de tu membresía. Tu tarjeta fue rechazada.\n\nNo te preocupes, reintentaremos procesar tu pago en los próximos días. Si lo prefieres, puedes actualizar tu método de pago aquí: ${frontendUrl}/mi-cuenta/pagos\n\nGracias por tu confianza en FLG.`;

        const html = `
                  <h3>No pudimos procesar el pago de tu membresía</h3>
                  <p>Hola <strong>${data.name}</strong>,</p>
                  <p>No pudimos procesar el pago de tu membresía. Tu tarjeta fue rechazada.</p>
                  <p>No te preocupes, reintentaremos procesar tu pago en los próximos días. Si lo prefieres, puedes <a href="${frontendUrl}/mi-cuenta/pagos">actualizar tu método de pago aquí</a>.</p>
                  <p>Gracias por tu confianza en FLG.</p>
                  `;

        await this.transporter.sendMail({
          from: `FLG <${process.env.GMAIL_USER}>`,
          to: data.to,
          subject: `No pudimos procesar el pago de tu membresía`,
          text,
          html,
        });
      } else {
        // Final attempt
        const text = `Hola ${data.name},\n\nTu membresía vence mañana.\n\nEsta fue nuestra última semana intentando procesar el pago automático. Si no actualizas tu método de pago o realizas un pago en persona antes del ${formattedEndDate}, tu acceso se cancelará.\n\nActualiza tu método de pago aquí: ${frontendUrl}/mi-cuenta/pagos\n\nGracias por tu confianza en FLG.`;

        const html = `
                  <h3>Tu membresía vence mañana</h3>
                  <p>Hola <strong>${data.name}</strong>,</p>
                  <p>Tu membresía vence mañana.</p>
                  <p>Esta fue nuestra última semana intentando procesar el pago automático. Si no actualizas tu método de pago o realizas un pago en persona antes del <strong>${formattedEndDate}</strong>, tu acceso se cancelará.</p>
                  <p><a href="${frontendUrl}/mi-cuenta/pagos">Actualiza tu método de pago aquí</a>.</p>
                  <p>Gracias por tu confianza en FLG.</p>
                  `;

        await this.transporter.sendMail({
          from: `FLG <${process.env.GMAIL_USER}>`,
          to: data.to,
          subject: `Tu membresía vence mañana`,
          text,
          html,
        });
      }
    } catch (error) {
      this.logger.error(
        `Error al enviar el aviso de renovación fallida`,
        error,
      );
    }
  }

  async sendRefundConfirmation(data: {
    to: string;
    name: string;
    refundedAmount: number;
    monthsCharged: number;
    cancelledOn: Date | string;
  }): Promise<void> {
    try {
      const formattedAmount = `$${data.refundedAmount.toLocaleString('es-AR')}`;
      const formattedCancelDate = this.formatDateDDMMYYYY(data.cancelledOn);
      const text = `Hola ${data.name},\n\nTe confirmamos que tu reembolso ha sido procesado:\n\nMonto reembolsado: ${formattedAmount}\nMeses cobrados a la tarifa regular: ${data.monthsCharged}\nFecha de cancelación: ${formattedCancelDate}\n\nGracias por haber sido parte de FLG.`;

      const html = `
                <h3>Reembolso procesado — FLG</h3>
                <p>Hola <strong>${data.name}</strong>,</p>
                <p>Te confirmamos que tu reembolso ha sido procesado:</p>
                <ul>
                  <li><strong>Monto reembolsado:</strong> ${formattedAmount}</li>
                  <li><strong>Meses cobrados a la tarifa regular:</strong> ${data.monthsCharged}</li>
                  <li><strong>Fecha de cancelación:</strong> ${formattedCancelDate}</li>
                </ul>
                <p>Gracias por haber sido parte de FLG.</p>
                `;

      await this.transporter.sendMail({
        from: `FLG <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: `Reembolso procesado — FLG`,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(`Error al enviar la confirmación de reembolso`, error);
    }
  }
}
