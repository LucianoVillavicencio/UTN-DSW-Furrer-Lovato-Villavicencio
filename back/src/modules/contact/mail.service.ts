import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor() {

    //Create conexion with SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
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
}
